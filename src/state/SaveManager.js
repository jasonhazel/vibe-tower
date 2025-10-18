const STORAGE_KEY = 'vibe_tower_save_v1';

export const SaveManager = {
  save(data) {
    try {
      if (typeof localStorage === 'undefined') return;
      const payload = { v: 1, t: Date.now(), data };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (_) { /* ignore */ }
  },

  load() {
    try {
      if (typeof localStorage === 'undefined') return null;
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.v !== 1) return null;
      return parsed.data || null;
    } catch (_) { return null; }
  },

  clear() {
    try { if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY); } catch (_) {}
  }
};


