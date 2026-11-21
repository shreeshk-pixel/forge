import { create } from "zustand";
import { persist } from "zustand/middleware";

export const MAX_SHARDS = 5;
export const REGEN_MS = 4 * 60 * 60 * 1000;

export type Stars = 1 | 2 | 3;

type ForgeState = {
  done: Record<string, Stars>;
  hinted: Record<string, boolean>;
  revealed: Record<string, boolean>;
  shards: number;
  shardAt: number;
  drafts: Record<string, string>;
  syncShards: () => void;
  spendHint: (id: string) => boolean;
  spendSolution: (id: string) => boolean;
  mark: (id: string, stars: Stars) => void;
  saveDraft: (id: string, code: string) => void;
  clearDraft: (id: string) => void;
};

export const useForge = create<ForgeState>()(
  persist(
    (set, get) => ({
      done: {},
      hinted: {},
      revealed: {},
      shards: 3,
      shardAt: 0,
      drafts: {},
      syncShards: () => {
        const { shards, shardAt } = get();
        const now = Date.now();
        if (shardAt === 0) {
          set({ shardAt: now });
          return;
        }
        if (shards >= MAX_SHARDS) return;
        const gained = Math.floor((now - shardAt) / REGEN_MS);
        if (gained <= 0) return;
        const next = Math.min(MAX_SHARDS, shards + gained);
        set({
          shards: next,
          shardAt: next >= MAX_SHARDS ? now : shardAt + gained * REGEN_MS,
        });
      },
      spendHint: (id) => {
        get().syncShards();
        const s = get();
        if (s.hinted[id]) return true;
        if (s.shards < 1) return false;
        const wasFull = s.shards >= MAX_SHARDS;
        set({
          shards: s.shards - 1,
          shardAt: wasFull ? Date.now() : s.shardAt,
          hinted: { ...s.hinted, [id]: true },
        });
        return true;
      },
      spendSolution: (id) => {
        get().syncShards();
        const s = get();
        if (!s.hinted[id]) return false;
        if (s.revealed[id]) return true;
        if (s.shards < 2) return false;
        const wasFull = s.shards >= MAX_SHARDS;
        set({
          shards: s.shards - 2,
          shardAt: wasFull ? Date.now() : s.shardAt,
          revealed: { ...s.revealed, [id]: true },
        });
        return true;
      },
      mark: (id, stars) => {
        const cur = get().done[id];
        if (cur != null && cur >= stars) return;
        set({ done: { ...get().done, [id]: stars } });
      },
      saveDraft: (id, code) => {
        if (get().drafts[id] === code) return;
        set({ drafts: { ...get().drafts, [id]: code } });
      },
      clearDraft: (id) => {
        if (get().drafts[id] == null) return;
        const drafts = { ...get().drafts };
        delete drafts[id];
        set({ drafts });
      },
    }),
    { name: "forge-progress-v1", skipHydration: true },
  ),
);

export function nextShardLabel(shards: number, shardAt: number, now = Date.now()): string | null {
  if (shards >= MAX_SHARDS || shardAt === 0) return null;
  const ms = Math.max(0, shardAt + REGEN_MS - now);
  const mins = Math.ceil(ms / 60000);
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  }
  return `${Math.max(1, mins)}m`;
}
