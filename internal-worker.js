const SESSION_COOKIE = "noshi_session";
const SESSION_DAYS = 14;
const PBKDF2_ITERATIONS = 100000;
const DATA_CHUNK_CHARS = 48000;
const MAX_DATA_JSON_CHARS = 2000000;
const MAX_BATCH_KEYS = 20;
const encoder = new TextEncoder();

const CLOUD_DATA_KEYS = new Set([
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
]);

function corsOrigin(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = String(env.INTERNAL_ORIGIN || "").trim();
  if (!origin) return "";
  if (allowed && origin === allowed) return origin;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return origin;
  return "";
}

function responseHeaders(request, env, extra = {}) {
  const headers = new Headers(extra);
  headers.set("Cache-Control", "no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  const origin = corsOrigin(request, env);
  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Vary", "Origin");
  }
  return headers;
}

function json(request, env, data, init = {}) {
  const headers = responseHeaders(request, env, init.headers || {});
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function cookieValue(request, name) {
  const cookie = request.headers.get("Cookie") || "";
  for (const part of cookie.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}

function bytesToHex(bytes) {
  return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex) {
  const clean = String(hex || "").trim();
  if (!/^[0-9a-f]+$/i.test(clean) || clean.length % 2) return new Uint8Array();
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function randomHex(byteLength = 32) {
  const b = new Uint8Array(byteLength);
  crypto.getRandomValues(b);
  return bytesToHex(b);
}

async function sha256Hex(value) {
  return bytesToHex(await crypto.subtle.digest("SHA-256", encoder.encode(String(value))));
}

async function derivePasswordHash(password, saltHex) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(String(password)), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({
    name: "PBKDF2",
    hash: "SHA-256",
    salt: hexToBytes(saltHex),
    iterations: PBKDF2_ITERATIONS,
  }, key, 256);
  return bytesToHex(bits);
}

function constantTimeEqual(a, b) {
  const x = encoder.encode(String(a));
  const y = encoder.encode(String(b));
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

async function ensureBootstrapUsers(env) {
  const specs = [
    ["owner", "المالك", env.OWNER_PASSWORD],
    ["mother", "الأم", env.MOTHER_PASSWORD],
  ];
  for (const [username, displayName, password] of specs) {
    if (!password) continue;
    const exists = await env.DB.prepare("SELECT id FROM users WHERE username = ? LIMIT 1").bind(username).first();
    if (exists) continue;
    const salt = randomHex(16);
    const hash = await derivePasswordHash(password, salt);
    await env.DB.prepare(`
      INSERT INTO users (username, display_name, password_hash, password_salt, active, font_scale, created_at)
      VALUES (?, ?, ?, ?, 1, 1.0, ?)
    `).bind(username, displayName, hash, salt, new Date().toISOString()).run();
  }
}

function bearerToken(request) {
  const auth = String(request.headers.get("Authorization") || "");
  const match = auth.match(/^Bearer\s+([A-Fa-f0-9]{64})$/);
  return match ? match[1] : "";
}

async function currentUser(request, env) {
  const token = bearerToken(request) || cookieValue(request, SESSION_COOKIE);
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  const row = await env.DB.prepare(`
    SELECT u.id, u.username, u.display_name, u.font_scale, s.expires_at
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND u.active = 1 LIMIT 1
  `).bind(tokenHash).first();
  if (!row) return null;
  if (Date.parse(row.expires_at) <= Date.now()) {
    await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(tokenHash).run();
    return null;
  }
  return row;
}

async function requireUser(request, env) {
  const user = await currentUser(request, env);
  if (!user) return { error: json(request, env, { ok: false, error: "UNAUTHORIZED" }, { status: 401 }) };
  return { user };
}

function sessionCookie(token) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${SESSION_DAYS * 86400}`;
}

function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0`;
}

async function login(request, env) {
  await ensureBootstrapUsers(env);

  let body;
  try { body = await request.json(); }
  catch { return json(request, env, { ok: false, error: "INVALID_JSON" }, { status: 400 }); }

  const username = String(body?.username || "").trim().toLowerCase();
  const password = String(body?.password || "");
  if (!username || !password || username.length > 64 || password.length > 256) {
    return json(request, env, { ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const attemptKey = await sha256Hex(`${ip}|${username}`);
  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const cleanupBefore = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [attempts] = await env.DB.batch([
    env.DB.prepare("SELECT COUNT(*) AS n FROM login_attempts WHERE attempt_key = ? AND created_at >= ?").bind(attemptKey, since),
    env.DB.prepare("DELETE FROM login_attempts WHERE created_at < ?").bind(cleanupBefore)
  ]);
  const attemptRow = attempts?.results?.[0] || {};
  if (Number(attemptRow.n || 0) >= 10) {
    return json(request, env, { ok: false, error: "TOO_MANY_ATTEMPTS" }, { status: 429, headers: { "Retry-After": "900" } });
  }

  const user = await env.DB.prepare("SELECT * FROM users WHERE username = ? AND active = 1 LIMIT 1").bind(username).first();
  let valid = false;
  if (user) {
    const hash = await derivePasswordHash(password, user.password_salt);
    valid = constantTimeEqual(hash, user.password_hash);
  }
  if (!valid) {
    await env.DB.prepare("INSERT INTO login_attempts (attempt_key, created_at) VALUES (?, ?)").bind(attemptKey, new Date().toISOString()).run();
    return json(request, env, { ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  const nowIso = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare("DELETE FROM login_attempts WHERE attempt_key = ?").bind(attemptKey),
    env.DB.prepare("DELETE FROM sessions WHERE expires_at <= ?").bind(nowIso)
  ]);

  const token = randomHex(32);
  const tokenHash = await sha256Hex(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400 * 1000).toISOString();
  await env.DB.prepare("INSERT INTO sessions (user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?)")
    .bind(user.id, tokenHash, expiresAt, nowIso).run();

  return json(request, env, {
    ok: true,
    token,
    expiresAt,
    user: { id: user.id, username: user.username, displayName: user.display_name, fontScale: user.font_scale }
  }, { headers: { "Set-Cookie": sessionCookie(token) } });
}

async function logout(request, env) {
  const token = bearerToken(request) || cookieValue(request, SESSION_COOKIE);
  if (token) {
    const tokenHash = await sha256Hex(token);
    await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(tokenHash).run();
  }
  return json(request, env, { ok: true }, { headers: { "Set-Cookie": clearSessionCookie() } });
}

function validDataKey(key) {
  return CLOUD_DATA_KEYS.has(String(key || ""));
}

function splitText(text, size = DATA_CHUNK_CHARS) {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) chunks.push(text.slice(i, i + size));
  return chunks.length ? chunks : [""];
}

async function dataStatus(request, env) {
  const rows = await env.DB.prepare(`
    SELECT key, revision, updated_at, updated_by
    FROM app_data_meta
    ORDER BY key
  `).all();
  return json(request, env, {
    ok: true,
    count: (rows.results || []).length,
    keys: rows.results || []
  });
}

async function getDataValue(request, env, key) {
  if (!validDataKey(key)) return json(request, env, { ok: false, error: "INVALID_DATA_KEY" }, { status: 404 });
  const meta = await env.DB.prepare("SELECT revision, updated_at, updated_by FROM app_data_meta WHERE key = ? LIMIT 1").bind(key).first();
  if (!meta) return json(request, env, { ok: true, exists: false, key, revision: 0, value: null });
  const rows = await env.DB.prepare("SELECT chunk_text FROM app_data_chunks WHERE key = ? ORDER BY chunk_index").bind(key).all();
  const text = (rows.results || []).map(r => r.chunk_text || "").join("");
  let value;
  try { value = JSON.parse(text); }
  catch { return json(request, env, { ok: false, error: "CORRUPT_DATA", key }, { status: 500 }); }
  return json(request, env, {
    ok: true,
    exists: true,
    key,
    revision: Number(meta.revision || 0),
    updatedAt: meta.updated_at,
    updatedBy: meta.updated_by,
    value
  });
}

async function getDataValues(request, env, url) {
  const requested = String(url.searchParams.get("keys") || "")
    .split(",").map(s => s.trim()).filter(Boolean);
  const keys = [...new Set(requested)];
  if (!keys.length || keys.length > MAX_BATCH_KEYS || keys.some(key => !validDataKey(key))) {
    return json(request, env, { ok: false, error: "INVALID_DATA_KEYS" }, { status: 400 });
  }

  const placeholders = keys.map(() => "?").join(",");
  const rows = await env.DB.prepare(`
    SELECT m.key, m.revision, m.updated_at, m.updated_by,
           c.chunk_index, c.chunk_text
    FROM app_data_meta m
    LEFT JOIN app_data_chunks c ON c.key = m.key
    WHERE m.key IN (${placeholders})
    ORDER BY m.key, c.chunk_index
  `).bind(...keys).all();

  const grouped = new Map();
  for (const row of rows.results || []) {
    let item = grouped.get(row.key);
    if (!item) {
      item = {
        exists: true,
        revision: Number(row.revision || 0),
        updatedAt: row.updated_at,
        updatedBy: row.updated_by,
        chunks: []
      };
      grouped.set(row.key, item);
    }
    if (row.chunk_text !== null && row.chunk_text !== undefined) item.chunks.push(row.chunk_text);
  }

  const values = {};
  for (const key of keys) {
    const item = grouped.get(key);
    if (!item) {
      values[key] = { exists: false, revision: 0, value: null };
      continue;
    }
    try {
      values[key] = {
        exists: true,
        revision: item.revision,
        updatedAt: item.updatedAt,
        updatedBy: item.updatedBy,
        value: JSON.parse(item.chunks.join(""))
      };
    } catch {
      return json(request, env, { ok: false, error: "CORRUPT_DATA", key }, { status: 500 });
    }
  }
  return json(request, env, { ok: true, values });
}

async function putDataValue(request, env, key, user) {
  if (!validDataKey(key)) return json(request, env, { ok: false, error: "INVALID_DATA_KEY" }, { status: 404 });
  let body;
  try { body = await request.json(); }
  catch { return json(request, env, { ok: false, error: "INVALID_JSON" }, { status: 400 }); }
  if (!Object.prototype.hasOwnProperty.call(body || {}, "value")) {
    return json(request, env, { ok: false, error: "MISSING_VALUE" }, { status: 400 });
  }

  const valueText = JSON.stringify(body.value);
  if (valueText.length > MAX_DATA_JSON_CHARS) {
    return json(request, env, { ok: false, error: "DATA_TOO_LARGE" }, { status: 413 });
  }

  const current = await env.DB.prepare("SELECT revision FROM app_data_meta WHERE key = ? LIMIT 1").bind(key).first();
  const currentRevision = Number(current?.revision || 0);
  const expectedRevision = body.expectedRevision;
  if (expectedRevision !== undefined && expectedRevision !== null && Number(expectedRevision) !== currentRevision) {
    return json(request, env, {
      ok: false,
      error: "REVISION_CONFLICT",
      key,
      currentRevision
    }, { status: 409 });
  }

  const chunks = splitText(valueText);
  const now = new Date().toISOString();
  const nextRevision = currentRevision + 1;
  const statements = [
    env.DB.prepare(`
      INSERT INTO app_data_meta (key, revision, updated_at, updated_by)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        revision = excluded.revision,
        updated_at = excluded.updated_at,
        updated_by = excluded.updated_by
    `).bind(key, nextRevision, now, user.username),
    env.DB.prepare("DELETE FROM app_data_chunks WHERE key = ?").bind(key)
  ];
  chunks.forEach((chunk, index) => {
    statements.push(env.DB.prepare("INSERT INTO app_data_chunks (key, chunk_index, chunk_text) VALUES (?, ?, ?)").bind(key, index, chunk));
  });
  await env.DB.batch(statements);

  return json(request, env, {
    ok: true,
    key,
    revision: nextRevision,
    updatedAt: now,
    chunks: chunks.length
  });
}

async function listIncoming(request, env) {
  // استعلام واحد بدل N+1 (كان يصل إلى 201 استعلامًا لـ 200 طلب).
  const rows = await env.ORDERS_DB.prepare(`
    WITH recent AS (
      SELECT id, order_number, customer_phone, delivery_zone, delivery_fee,
             delivery_date, delivery_time, notes, subtotal, total, status,
             idempotency_key, created_at
      FROM orders
      WHERE status = 'new'
      ORDER BY id DESC
      LIMIT 200
    )
    SELECT r.*,
           oi.id AS item_row_id,
           oi.product_id, oi.product_name_snapshot, oi.unit_price,
           oi.quantity, oi.line_total
    FROM recent r
    LEFT JOIN order_items oi ON oi.order_id = r.id
    ORDER BY r.id DESC, oi.id ASC
  `).all();

  const byId = new Map();
  for (const row of rows.results || []) {
    let order = byId.get(row.id);
    if (!order) {
      order = {
        id: row.id,
        externalRequestId: row.idempotency_key,
        orderNumber: row.order_number,
        phone: row.customer_phone,
        deliveryArea: row.delivery_zone,
        deliveryFee: Number(row.delivery_fee || 0),
        deliveryDate: row.delivery_date,
        deliveryTime: row.delivery_time,
        notes: row.notes || "",
        subtotal: Number(row.subtotal || 0),
        total: Number(row.total || 0),
        status: row.status,
        createdAt: row.created_at,
        items: []
      };
      byId.set(row.id, order);
    }
    if (row.item_row_id !== null && row.item_row_id !== undefined) {
      order.items.push({
        productId: row.product_id,
        name: row.product_name_snapshot,
        productName: row.product_name_snapshot,
        price: Number(row.unit_price || 0),
        quantity: Number(row.quantity || 1),
        qty: Number(row.quantity || 1),
        lineTotal: Number(row.line_total || 0),
      });
    }
  }
  return json(request, env, { ok: true, orders: [...byId.values()] });
}

async function decideIncoming(request, env, orderId, decision, user) {
  const id = Number(orderId);
  if (!Number.isInteger(id) || id <= 0) return json(request, env, { ok: false, error: "INVALID_ORDER_ID" }, { status: 400 });
  const order = await env.ORDERS_DB.prepare("SELECT id, status FROM orders WHERE id = ? LIMIT 1").bind(id).first();
  if (!order) return json(request, env, { ok: false, error: "ORDER_NOT_FOUND" }, { status: 404 });
  if (order.status !== "new") return json(request, env, { ok: false, error: "ORDER_ALREADY_DECIDED", status: order.status }, { status: 409 });
  const status = decision === "accept" ? "accepted" : "rejected";
  const result = await env.ORDERS_DB.prepare("UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'new'")
    .bind(status, id).run();
  if (Number(result?.meta?.changes || 0) !== 1) {
    return json(request, env, { ok: false, error: "ORDER_ALREADY_DECIDED" }, { status: 409 });
  }
  return json(request, env, { ok: true, id, status, decidedBy: user.username });
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      const requestOrigin = request.headers.get("Origin") || "";

      if (request.method === "OPTIONS") {
        const origin = corsOrigin(request, env);
        if (!origin) return new Response(null, { status: 403 });
        return new Response(null, { status: 204, headers: responseHeaders(request, env, {
          "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        }) });
      }

      // CORS وحده لا يمنع CSRF. إذا أرسل المتصفح Origin غير مصرح به نوقف الطلب قبل أي قراءة/تعديل.
      if (requestOrigin && !corsOrigin(request, env)) {
        return json(request, env, { ok: false, error: "ORIGIN_FORBIDDEN" }, { status: 403 });
      }

      if (url.pathname === "/api/health" && request.method === "GET") {
        const internalDb = await env.DB.prepare("SELECT 1 AS ok").first();
        const ordersTable = await env.ORDERS_DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='orders' LIMIT 1").first();
        const appDataTable = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='app_data_meta' LIMIT 1").first();
        return json(request, env, {
          ok: true,
          service: "Noshi Internal API",
          internalDatabase: internalDb?.ok === 1,
          ordersDatabase: ordersTable?.name === "orders",
          appDataDatabase: appDataTable?.name === "app_data_meta",
        });
      }

      if (url.pathname === "/api/auth/login" && request.method === "POST") return login(request, env);

      if (url.pathname === "/api/auth/me" && request.method === "GET") {
        const auth = await requireUser(request, env); if (auth.error) return auth.error;
        return json(request, env, { ok: true, id: auth.user.id, username: auth.user.username, displayName: auth.user.display_name, fontScale: auth.user.font_scale });
      }

      if (url.pathname === "/api/auth/logout" && request.method === "POST") {
        const auth = await requireUser(request, env); if (auth.error) return auth.error;
        return logout(request, env);
      }

      if (url.pathname === "/api/data/status" && request.method === "GET") {
        const auth = await requireUser(request, env); if (auth.error) return auth.error;
        return dataStatus(request, env);
      }

      if (url.pathname === "/api/data" && request.method === "GET") {
        const auth = await requireUser(request, env); if (auth.error) return auth.error;
        return getDataValues(request, env, url);
      }

      const dataMatch = url.pathname.match(/^\/api\/data\/([A-Za-z0-9_]+)$/);
      if (dataMatch && request.method === "GET") {
        const auth = await requireUser(request, env); if (auth.error) return auth.error;
        return getDataValue(request, env, dataMatch[1]);
      }
      if (dataMatch && request.method === "PUT") {
        const auth = await requireUser(request, env); if (auth.error) return auth.error;
        return putDataValue(request, env, dataMatch[1], auth.user);
      }

      if (url.pathname === "/api/incoming-orders" && request.method === "GET") {
        const auth = await requireUser(request, env); if (auth.error) return auth.error;
        return listIncoming(request, env);
      }

      const decisionMatch = url.pathname.match(/^\/api\/incoming-orders\/(\d+)\/(accept|reject)$/);
      if (decisionMatch && request.method === "POST") {
        const auth = await requireUser(request, env); if (auth.error) return auth.error;
        return decideIncoming(request, env, decisionMatch[1], decisionMatch[2], auth.user);
      }

      return json(request, env, { ok: false, error: "NOT_FOUND" }, { status: 404 });
    } catch (error) {
      console.error("Noshi Internal API error", error);
      return json(request, env, { ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
    }
  },
};
