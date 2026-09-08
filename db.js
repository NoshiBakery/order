/* =========================================================
   Noshi Bakery Storage — Cloud D1 + local private drafts
   - Shared business data is stored through the authenticated Worker/D1.
   - Temporary per-device drafts stay in IndexedDB and are never shared.
   - Same NoshiDB API is preserved so existing pages do not need rewrites.
========================================================= */

(function () {
  "use strict";

  const DB_NAME = "noshi_bakery_db";
  const DB_VERSION = 1;
  const STORE_NAME = "app_data";

  const CLOUD_KEYS = [
    "clients",
    "salesData",
    "mandoubOrders",
    "expensesData",
    "expenseItems",
    "chocotime_data",
    "chocochips_data",
    "ramz_data",
    "alsafra_data",
    "order_products_checkboxes_final",
    "bulk_pay_undo_history_v1",
    "clientsTableFontSize",
    "mandoubsTableFontSize",
    "ordersTableFontSize",
    "salesTableFontSize",
    "lastUpdateDay"
  ];

  const LOCAL_ONLY_KEYS = new Set([
    "editingOrder",
    "incomingOrderDraft"
  ]);

  const KNOWN_KEYS = CLOUD_KEYS.slice();
  const revisions = new Map();
  let dbPromise = null;

  function cloudEnabled() {
    return !!(window.NOSHI_CONFIG && window.NOSHI_CONFIG.CLOUD_ENABLED === true);
  }

  function isCloudKey(key) {
    return cloudEnabled() && CLOUD_KEYS.includes(String(key || ""));
  }

  async function cloudApi(path, options) {
    if (!window.NoshiAuth || typeof window.NoshiAuth.api !== "function") {
      throw new Error("تعذر الاتصال بالتخزين السحابي. حدّث الصفحة وحاول مرة أخرى.");
    }
    return window.NoshiAuth.api(path, options || {});
  }

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error("IndexedDB غير مدعوم في هذا المتصفح"));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = function (event) {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "key" });
        }
      };
      request.onsuccess = event => resolve(event.target.result);
      request.onerror = () => reject(request.error || new Error("فشل فتح قاعدة البيانات المحلية"));
      request.onblocked = () => reject(new Error("قاعدة البيانات المحلية محجوبة. أغلق الصفحات الأخرى ثم حاول مرة أخرى."));
    });
    return dbPromise;
  }

  async function localTransaction(mode, callback) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const store = tx.objectStore(STORE_NAME);
      let callbackResult;
      tx.oncomplete = () => resolve(callbackResult);
      tx.onerror = () => reject(tx.error || new Error("حدث خطأ أثناء التخزين المحلي"));
      tx.onabort = () => reject(tx.error || new Error("تم إلغاء عملية التخزين المحلي"));
      try { callbackResult = callback(store, tx); }
      catch (error) {
        try { tx.abort(); } catch (_) {}
        reject(error);
      }
    });
  }

  async function localSet(key, value) {
    await localTransaction("readwrite", store => {
      store.put({ key, value, updatedAt: new Date().toISOString() });
    });
    return true;
  }

  async function localGet(key, defaultValue = null) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).get(key);
      request.onsuccess = () => {
        const row = request.result;
        resolve(row && Object.prototype.hasOwnProperty.call(row, "value") ? row.value : defaultValue);
      };
      request.onerror = () => reject(request.error || new Error("فشل قراءة البيانات المحلية"));
    });
  }

  async function localRemove(key) {
    await localTransaction("readwrite", store => store.delete(key));
    return true;
  }

  async function localKeys() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAllKeys();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error || new Error("فشل جلب مفاتيح البيانات المحلية"));
    });
  }

  async function localGetAll() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll();
      request.onsuccess = () => {
        const output = {};
        (request.result || []).forEach(row => { output[row.key] = row.value; });
        resolve(output);
      };
      request.onerror = () => reject(request.error || new Error("فشل جلب البيانات المحلية"));
    });
  }

  function conflictError(key) {
    const err = new Error("تم تعديل البيانات من جهاز آخر. حدّث الصفحة قبل الحفظ حتى لا تُستبدل التغييرات الجديدة.");
    err.code = "REVISION_CONFLICT";
    err.key = key;
    return err;
  }

  async function cloudGet(key, defaultValue = null) {
    const result = await cloudApi(`/api/data/${encodeURIComponent(key)}`);
    revisions.set(key, Number(result.revision || 0));
    return result.exists ? result.value : defaultValue;
  }

  async function cloudSet(key, value, options = {}) {
    const payload = { value };
    if (options.expectedRevision !== undefined) {
      payload.expectedRevision = Number(options.expectedRevision);
    } else if (revisions.has(key)) {
      payload.expectedRevision = Number(revisions.get(key));
    }
    try {
      const result = await cloudApi(`/api/data/${encodeURIComponent(key)}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      revisions.set(key, Number(result.revision || 0));
      return true;
    } catch (error) {
      if (error && (error.status === 409 || error.data?.error === "REVISION_CONFLICT")) {
        revisions.delete(key);
        throw conflictError(key);
      }
      throw error;
    }
  }

  async function set(key, value) {
    if (!key || typeof key !== "string") throw new Error("مفتاح التخزين غير صحيح");
    if (LOCAL_ONLY_KEYS.has(key) || !isCloudKey(key)) return localSet(key, value);
    return cloudSet(key, value);
  }

  async function get(key, defaultValue = null) {
    if (!key || typeof key !== "string") throw new Error("مفتاح التخزين غير صحيح");
    if (LOCAL_ONLY_KEYS.has(key) || !isCloudKey(key)) return localGet(key, defaultValue);
    return cloudGet(key, defaultValue);
  }

  async function getMany(keys, defaults = {}) {
    if (!Array.isArray(keys)) throw new Error("قائمة مفاتيح القراءة غير صحيحة");
    const uniqueKeys = [...new Set(keys.map(k => String(k || "")).filter(Boolean))];
    const pairs = await Promise.all(uniqueKeys.map(async key => {
      const fallback = Object.prototype.hasOwnProperty.call(defaults, key) ? defaults[key] : null;
      return [key, await get(key, fallback)];
    }));
    return Object.fromEntries(pairs);
  }

  async function has(key) {
    const value = await get(key, undefined);
    return value !== undefined;
  }

  async function remove(key) {
    if (!key || typeof key !== "string") throw new Error("مفتاح التخزين غير صحيح");
    // Shared business keys are intentionally not deletable from the browser API.
    // Existing app only removes temporary draft keys, which stay local.
    if (LOCAL_ONLY_KEYS.has(key) || !isCloudKey(key)) return localRemove(key);
    throw new Error("حذف بيانات النظام السحابية مباشرة غير مسموح للحماية من الحذف بالخطأ");
  }

  async function status() {
    if (!cloudEnabled()) {
      const ks = await localKeys();
      return { ok: true, count: ks.length, keys: ks.map(key => ({ key })) };
    }
    return cloudApi("/api/data/status");
  }

  async function keys() {
    if (!cloudEnabled()) return localKeys();
    const remote = await status();
    const cloud = (remote.keys || []).map(x => x.key);
    const local = (await localKeys()).filter(k => LOCAL_ONLY_KEYS.has(k));
    return [...new Set([...cloud, ...local])];
  }

  async function getAll() {
    if (!cloudEnabled()) return localGetAll();
    const remote = await status();
    const output = {};
    for (const row of remote.keys || []) {
      if (!CLOUD_KEYS.includes(row.key)) continue;
      output[row.key] = await cloudGet(row.key, null);
    }
    const local = await localGetAll();
    LOCAL_ONLY_KEYS.forEach(key => {
      if (Object.prototype.hasOwnProperty.call(local, key)) output[key] = local[key];
    });
    return output;
  }

  async function setMany(dataObject, options = {}) {
    if (!dataObject || typeof dataObject !== "object" || Array.isArray(dataObject)) {
      throw new Error("بيانات الاستيراد يجب أن تكون كائن JSON صحيح");
    }

    if (options.initialOnly && cloudEnabled()) {
      const remote = await status();
      if (Number(remote.count || 0) > 0) {
        const err = new Error("قاعدة البيانات السحابية تحتوي بيانات مسبقًا. تم إيقاف الاستيراد لحمايتها من الاستبدال.");
        err.code = "CLOUD_NOT_EMPTY";
        throw err;
      }
    }

    const incomingKeys = Object.keys(dataObject);
    const importedKeys = [];
    const skippedKeys = [];

    for (const key of incomingKeys) {
      if (LOCAL_ONLY_KEYS.has(key)) {
        await localSet(key, dataObject[key]);
        importedKeys.push(key);
        continue;
      }
      if (cloudEnabled()) {
        if (!CLOUD_KEYS.includes(key)) {
          skippedKeys.push(key);
          continue;
        }
        await cloudSet(key, dataObject[key], options.initialOnly ? { expectedRevision: 0 } : {});
        importedKeys.push(key);
      } else {
        await localSet(key, dataObject[key]);
        importedKeys.push(key);
      }
    }

    return {
      success: true,
      importedKeys,
      importedCount: importedKeys.length,
      skippedKeys
    };
  }

  async function importAll(dataObject, options = {}) {
    return setMany(dataObject, options);
  }

  async function exportAll() {
    return getAll();
  }

  async function importFromFile(file, options = {}) {
    if (!file) throw new Error("لم يتم اختيار ملف");
    const text = await file.text();
    const jsonData = JSON.parse(text);
    if (!jsonData || typeof jsonData !== "object" || Array.isArray(jsonData)) {
      throw new Error("ملف JSON غير صحيح");
    }
    return importAll(jsonData, options);
  }

  async function exportToFile(filename) {
    const data = await exportAll();
    const safeFilename = filename || `noshi-backup-cloud-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = safeFilename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => { URL.revokeObjectURL(url); link.remove(); }, 500);
    return true;
  }

  function countSummary(dataObject) {
    const data = dataObject || {};
    return {
      clients: Array.isArray(data.clients) ? data.clients.length : 0,
      salesMonths: data.salesData && typeof data.salesData === "object" ? Object.keys(data.salesData).length : 0,
      mandoubGroups: data.mandoubOrders && typeof data.mandoubOrders === "object" ? Object.keys(data.mandoubOrders).length : 0,
      expensesMonths: data.expensesData && typeof data.expensesData === "object" ? Object.keys(data.expensesData).length : 0,
      allKeys: Object.keys(data).length
    };
  }

  window.NoshiDB = Object.freeze({
    DB_NAME,
    DB_VERSION,
    STORE_NAME,
    KNOWN_KEYS,
    CLOUD_KEYS: CLOUD_KEYS.slice(),
    LOCAL_ONLY_KEYS,
    openDB,
    set,
    get,
    getMany,
    has,
    remove,
    keys,
    getAll,
    setMany,
    importAll,
    importFromFile,
    exportAll,
    exportToFile,
    countSummary,
    status
  });
})();
