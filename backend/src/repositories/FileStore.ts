import fs from "fs";
import path from "path";
import { config } from "../config/env";

type Row = { id: number };

class FileStore {
  private dataDir: string;
  private cache: Map<string, Row[]> = new Map();

  constructor() {
    this.dataDir = config.dispatchDataDir;
    fs.mkdirSync(this.dataDir, { recursive: true });
  }

  private file(name: string): string {
    return path.join(this.dataDir, `${name}.json`);
  }

  read<T extends Row>(name: string): T[] {
    const cached = this.cache.get(name);
    if (cached) return cached as T[];
    const f = this.file(name);
    let rows: T[] = [];
    if (fs.existsSync(f)) {
      try {
        rows = JSON.parse(fs.readFileSync(f, "utf8")) as T[];
      } catch {
        rows = [];
      }
    }
    this.cache.set(name, rows as Row[]);
    return rows;
  }

  private write(name: string, rows: Row[]): void {
    this.cache.set(name, rows);
    fs.writeFileSync(this.file(name), JSON.stringify(rows, null, 2), "utf8");
  }

  insert<T extends Row>(name: string, row: Partial<T> & { id?: number }): T {
    const rows = this.read<T>(name);
    const provided = typeof row.id === "number" && row.id > 0 ? row.id : undefined;
    const id = provided ?? rows.reduce((max, r) => Math.max(max, r.id), 0) + 1;
    const created = { ...row, id } as T;
    rows.push(created);
    this.write(name, rows as Row[]);
    return created;
  }

  update<T extends Row>(name: string, id: number, patch: Record<string, unknown>): T | undefined {
    const rows = this.read<T>(name);
    const idx = rows.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;
    rows[idx] = { ...rows[idx], ...patch } as T;
    this.write(name, rows as Row[]);
    return rows[idx];
  }

  find<T extends Row>(name: string, predicate: (row: T) => boolean): T | undefined {
    return this.read<T>(name).find(predicate);
  }

  filter<T extends Row>(name: string, predicate: (row: T) => boolean): T[] {
    return this.read<T>(name).filter(predicate);
  }
}

export const fileStore = new FileStore();
