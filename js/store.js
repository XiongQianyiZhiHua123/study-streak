// ============================================================
//  store.js — 存储接口。界面只调用这里，以后换存储方式只改这个文件。
// ============================================================
import { DEFAULT_SETTINGS, DEFAULT_SUBJECTS, DEFAULT_PLAY_CATS } from './config.js';

const KEY = 'studyStreak.data';
const SCHEMA = 1;
const clone = (o) => JSON.parse(JSON.stringify(o));

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function fresh() {
  return {
    schema: SCHEMA,
    settings: { ...DEFAULT_SETTINGS },
    subjects: clone(DEFAULT_SUBJECTS),
    sessions: [],
    makeups: [],
    reflections: {},
    words: [],
    plays: [],
    playCats: clone(DEFAULT_PLAY_CATS),
    active: null,
    playActive: null,
    createdAt: Date.now(),
  };
}

/** 补齐缺失字段；以后 schema 升级在这里写迁移 */
function migrate(d) {
  if (!d || typeof d !== 'object') return fresh();
  d.settings = { ...DEFAULT_SETTINGS, ...(d.settings || {}) };
  if (!Array.isArray(d.subjects) || !d.subjects.length) d.subjects = clone(DEFAULT_SUBJECTS);
  for (const k of ['sessions', 'makeups', 'words']) if (!Array.isArray(d[k])) d[k] = [];
  if (!d.reflections || typeof d.reflections !== 'object') d.reflections = {};
  if (!Array.isArray(d.plays)) d.plays = [];
  if (!Array.isArray(d.playCats) || !d.playCats.length) d.playCats = clone(DEFAULT_PLAY_CATS);
  else for (const c of clone(DEFAULT_PLAY_CATS)) if (!d.playCats.some((x) => x.id === c.id)) d.playCats.push(c); // 新版本新增的默认类别补上
  if (d.active === undefined) d.active = null;
  if (d.playActive === undefined) d.playActive = null;
  d.schema = SCHEMA;
  return d;
}

export const store = {
  data: null,

  load() {
    try {
      const raw = localStorage.getItem(KEY);
      this.data = migrate(raw ? JSON.parse(raw) : null);
    } catch (e) {
      console.error('load failed', e);
      this.data = fresh();
    }
    return this.data;
  },

  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
      return true;
    } catch (e) {
      console.error('save failed', e);
      return false;
    }
  },

  exportJSON() {
    return JSON.stringify({ app: 'study-streak', schema: SCHEMA, exportedAt: new Date().toISOString(), data: this.data });
  },

  importJSON(text) {
    const o = JSON.parse(text);
    const d = o && o.data ? o.data : o;
    if (!d || !Array.isArray(d.sessions)) throw new Error('invalid backup');
    this.data = migrate(d);
    this.save();
  },

  /** 请求浏览器把数据标记为“持久”，降低被清理的可能 */
  async requestPersist() {
    try { if (navigator.storage?.persist) await navigator.storage.persist(); } catch (_) {}
  },
};
