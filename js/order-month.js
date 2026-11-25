// Read-only month classification; never move stored salesData records.
function getOrderDisplayMonth(order, sourceMonth) {
  const normalize = value => String(value ?? "").replace(/[٠-٩۰-۹]/g, c => String(c.charCodeAt(0) - (c <= "٩" ? 0x660 : 0x6f0))).replace(/[\u200e\u200f\u061c]/g, "").trim();
  const date = normalize(order?.date);
  const iso = date.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?=$|[ T،,])/);
  const legacy = date.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?=$|[ T،,])/);
  const parts = iso ? [iso[1], iso[2], iso[3]] : legacy ? [legacy[3], legacy[2], legacy[1]] : null;
  if (parts) {
    const [y, m, d] = parts.map(Number);
    const check = new Date(Date.UTC(y, m - 1, d));
    if (check.getUTCFullYear() === y && check.getUTCMonth() + 1 === m && check.getUTCDate() === d)
      return `${y}-${String(m).padStart(2, "0")}`;
  }
  const fallback = normalize(sourceMonth).match(/^(\d{4})[-/](\d{1,2})$/);
  return fallback && +fallback[2] >= 1 && +fallback[2] <= 12 ? `${fallback[1]}-${fallback[2].padStart(2,"0")}` : sourceMonth;
}
function groupSalesByDisplayMonth(data) {
  const grouped = Object.create(null);
  if (!data || typeof data !== "object" || Array.isArray(data)) return grouped;
  for (const [source, rows] of Object.entries(data)) {
    if (!Array.isArray(rows)) continue;
    for (const order of rows) {
      if (!order) continue;
      (grouped[getOrderDisplayMonth(order, source)] ||= []).push(order);
    }
  }
  return grouped;
}
