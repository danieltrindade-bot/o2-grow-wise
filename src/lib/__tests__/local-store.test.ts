import { describe, it, expect, beforeEach, vi } from "vitest";

const mockStorage = new Map<string, string>();

const localStorageMock: Storage = {
  getItem: (key: string) => mockStorage.get(key) ?? null,
  setItem: (key: string, value: string) => { mockStorage.set(key, value); },
  removeItem: (key: string) => { mockStorage.delete(key); },
  clear: () => mockStorage.clear(),
  get length() { return mockStorage.size; },
  key: (index: number) => [...mockStorage.keys()][index] ?? null,
};

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });

vi.stubGlobal("crypto", {
  randomUUID: () => "test-uuid-" + Math.random().toString(36).slice(2, 9),
});

import { selectAll, insertRows, updateRow, deleteRow, resetTable, resetAllTables } from "../local-store";

describe("local-store", () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  describe("selectAll", () => {
    it("returns seed data when table is empty", () => {
      const rows = selectAll("bpo_packages");
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0]).toHaveProperty("name");
    });

    it("persists seed data to localStorage on first access", () => {
      selectAll("bpo_packages");
      expect(mockStorage.has("o2-data-bpo_packages")).toBe(true);
    });

    it("returns empty array for unknown table", () => {
      const rows = selectAll("nonexistent_table");
      expect(rows).toEqual([]);
    });

    it("sorts by orderBy field (numeric)", () => {
      const data = [
        { id: "1", sort_order: 3, name: "C" },
        { id: "2", sort_order: 1, name: "A" },
        { id: "3", sort_order: 2, name: "B" },
      ];
      mockStorage.set("o2-data-test_sort", JSON.stringify(data));
      const rows = selectAll("test_sort", "sort_order");
      expect(rows.map((r: any) => r.name)).toEqual(["A", "B", "C"]);
    });

    it("sorts by orderBy field (string)", () => {
      const data = [
        { id: "1", name: "Charlie" },
        { id: "2", name: "Alice" },
        { id: "3", name: "Bob" },
      ];
      mockStorage.set("o2-data-test_sort_str", JSON.stringify(data));
      const rows = selectAll("test_sort_str", "name");
      expect(rows.map((r: any) => r.name)).toEqual(["Alice", "Bob", "Charlie"]);
    });

    it("returns data without sorting when orderBy is not provided", () => {
      const data = [
        { id: "1", name: "C" },
        { id: "2", name: "A" },
      ];
      mockStorage.set("o2-data-test_nosort", JSON.stringify(data));
      const rows = selectAll("test_nosort");
      expect(rows.map((r: any) => r.name)).toEqual(["C", "A"]);
    });
  });

  describe("insertRows", () => {
    it("inserts rows with generated UUIDs", () => {
      mockStorage.set("o2-data-test_insert", JSON.stringify([]));
      const result = insertRows("test_insert", [{ name: "new item" }]);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBeDefined();
      expect(result[0].name).toBe("new item");
    });

    it("preserves existing ID if provided", () => {
      mockStorage.set("o2-data-test_insert_id", JSON.stringify([]));
      const result = insertRows("test_insert_id", [{ id: "my-id", name: "test" }]);
      expect(result[0].id).toBe("my-id");
    });

    it("appends to existing data", () => {
      mockStorage.set("o2-data-test_append", JSON.stringify([{ id: "existing", name: "old" }]));
      insertRows("test_append", [{ name: "new" }]);
      const all = selectAll("test_append");
      expect(all).toHaveLength(2);
    });

    it("persists data to localStorage", () => {
      mockStorage.set("o2-data-test_persist", JSON.stringify([]));
      insertRows("test_persist", [{ name: "persisted" }]);
      const stored = JSON.parse(mockStorage.get("o2-data-test_persist")!);
      expect(stored).toHaveLength(1);
      expect(stored[0].name).toBe("persisted");
    });
  });

  describe("updateRow", () => {
    it("updates an existing row by id", () => {
      mockStorage.set("o2-data-test_update", JSON.stringify([{ id: "u1", name: "old", value: 10 }]));
      updateRow("test_update", "u1", { name: "new" });
      const rows = selectAll("test_update");
      expect(rows[0]).toMatchObject({ id: "u1", name: "new", value: 10 });
    });

    it("does nothing if id not found", () => {
      mockStorage.set("o2-data-test_update_miss", JSON.stringify([{ id: "u1", name: "old" }]));
      updateRow("test_update_miss", "nonexistent", { name: "new" });
      const rows = selectAll("test_update_miss");
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ id: "u1", name: "old" });
    });
  });

  describe("deleteRow", () => {
    it("removes a row by id", () => {
      mockStorage.set("o2-data-test_delete", JSON.stringify([
        { id: "d1", name: "keep" },
        { id: "d2", name: "remove" },
      ]));
      deleteRow("test_delete", "d2");
      const rows = selectAll("test_delete");
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ id: "d1", name: "keep" });
    });

    it("handles deletion of nonexistent id gracefully", () => {
      mockStorage.set("o2-data-test_delete_miss", JSON.stringify([{ id: "d1", name: "keep" }]));
      deleteRow("test_delete_miss", "nonexistent");
      const rows = selectAll("test_delete_miss");
      expect(rows).toHaveLength(1);
    });
  });

  describe("resetTable", () => {
    it("removes a table from localStorage", () => {
      mockStorage.set("o2-data-test_reset", JSON.stringify([{ id: "1" }]));
      resetTable("test_reset");
      expect(mockStorage.has("o2-data-test_reset")).toBe(false);
    });
  });

  describe("resetAllTables", () => {
    it("removes all seed data tables", () => {
      selectAll("bpo_packages");
      selectAll("cfo_base_rules");
      expect(mockStorage.has("o2-data-bpo_packages")).toBe(true);
      expect(mockStorage.has("o2-data-cfo_base_rules")).toBe(true);
      resetAllTables();
      expect(mockStorage.has("o2-data-bpo_packages")).toBe(false);
      expect(mockStorage.has("o2-data-cfo_base_rules")).toBe(false);
    });
  });

  describe("QuotaExceededError handling", () => {
    it("throws descriptive error on QuotaExceededError", () => {
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = () => {
        const err = new DOMException("quota exceeded", "QuotaExceededError");
        throw err;
      };

      mockStorage.set("o2-data-test_quota", JSON.stringify([]));

      expect(() => insertRows("test_quota", [{ name: "big data" }])).toThrow(
        "localStorage cheio",
      );

      localStorageMock.setItem = originalSetItem;
    });
  });
});
