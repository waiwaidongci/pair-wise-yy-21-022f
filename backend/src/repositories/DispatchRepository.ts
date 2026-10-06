import fs from "fs";
import path from "path";
import { config } from "../config/env";
import { createInitialDispatchState } from "../constructors/DispatchStateFactory";
import type { DispatchState } from "../models/DispatchState";

/**
 * 调度台状态仓库：内存态 + JSON 文件落盘。
 * 所有写操作经 mutate 串行化（互斥锁），保证两个调度员同时确认同一单时只有一个放行。
 * 文件写入采用 tmp + rename 的原子替换，进程重启后从文件恢复，队列/占用/待对账不丢。
 */
let cached: DispatchState | null = null;
let chain: Promise<unknown> = Promise.resolve();

const load = (): DispatchState => {
  if (cached) return cached;
  try {
    if (fs.existsSync(config.dispatchStateFile)) {
      cached = JSON.parse(fs.readFileSync(config.dispatchStateFile, "utf-8")) as DispatchState;
      return cached;
    }
  } catch (err) {
    console.error("dispatch state file corrupted, reseeding:", err);
  }
  cached = createInitialDispatchState();
  persist(cached);
  return cached;
};

const persist = (state: DispatchState): void => {
  const file = config.dispatchStateFile;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, file);
};

export const dispatchRepository = {
  read: (): DispatchState => load(),
  mutate<T>(fn: (state: DispatchState) => T): Promise<T> {
    const run = chain.then(async () => {
      const state = load();
      const result = fn(state);
      persist(state);
      return result;
    });
    chain = run.catch(() => undefined);
    return run;
  },
  reset(): Promise<DispatchState> {
    return this.mutate((state) => {
      const fresh = createInitialDispatchState();
      Object.keys(state).forEach((key) => delete (state as unknown as Record<string, unknown>)[key]);
      Object.assign(state, fresh);
      return state;
    });
  }
};
