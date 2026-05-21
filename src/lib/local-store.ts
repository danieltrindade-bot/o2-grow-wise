import { SEED_DATA, SEED_VERSION } from "./seed-data";

const PREFIX = "o2-data-";
const VERSION_KEY = "o2-seed-version";

function checkSeedVersion(): void {
  const stored = localStorage.getItem(VERSION_KEY);
  if (stored !== String(SEED_VERSION)) {
    Object.keys(SEED_DATA).forEach((t) => localStorage.removeItem(PREFIX + t));
    localStorage.setItem(VERSION_KEY, String(SEED_VERSION));
  }
}
checkSeedVersion();

function getTable<T = any>(table: string): T[] {
  const raw = localStorage.getItem(PREFIX + table);
  if (raw) return JSON.parse(raw);
  const seed = (SEED_DATA[table] ?? []) as T[];
  localStorage.setItem(PREFIX + table, JSON.stringify(seed));
  return seed;
}

function setTable(table: string, data: any[]): void {
  try {
    localStorage.setItem(PREFIX + table, JSON.stringify(data));
  } catch (e) {
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      throw new Error("localStorage cheio. Limpe dados antigos ou exporte antes de continuar.");
    }
    throw e;
  }
}

export function selectAll<T = any>(table: string, orderBy?: string): T[] {
  const rows = getTable<T>(table);
  if (orderBy) {
    rows.sort((a: any, b: any) => {
      const va = a[orderBy];
      const vb = b[orderBy];
      if (typeof va === "number" && typeof vb === "number") return va - vb;
      return String(va).localeCompare(String(vb));
    });
  }
  return rows;
}

export function insertRows(table: string, rows: Record<string, any>[]): Record<string, any>[] {
  const current = getTable(table);
  const withIds = rows.map((r) => ({ ...r, id: r.id || crypto.randomUUID() }));
  setTable(table, [...current, ...withIds]);
  return withIds;
}

export function updateRow(table: string, id: string, data: Record<string, any>): void {
  const rows = getTable(table);
  const idx = rows.findIndex((r: any) => r.id === id);
  if (idx >= 0) {
    rows[idx] = { ...rows[idx], ...data };
    setTable(table, rows);
  }
}

export function deleteRow(table: string, id: string): void {
  const rows = getTable(table).filter((r: any) => r.id !== id);
  setTable(table, rows);
}

export function resetTable(table: string): void {
  localStorage.removeItem(PREFIX + table);
}

export function resetAllTables(): void {
  Object.keys(SEED_DATA).forEach((t) => localStorage.removeItem(PREFIX + t));
}
