// ============================================================
//  dict.js — 离线英汉字典（ECDICT 精简版，MIT 许可）
// ============================================================
import { guessLemmas } from './logic.js';

let DICT = null;
let loading = null;

export function loadDict() {
  if (DICT) return Promise.resolve(DICT);
  if (!loading) {
    loading = fetch('data/dict.json')
      .then((r) => r.json())
      .then((d) => (DICT = d))
      .catch((e) => { loading = null; throw e; });
  }
  return loading;
}

const entry = (w) => {
  const e = DICT.w[w];
  return e ? { word: w, phon: e[0], meaning: e[1] } : null;
};

/**
 * 查词。返回 { word, phon, meaning, base? }；base 表示输入是变形词、结果来自原形。
 * 找不到返回 null。
 */
export async function lookup(input) {
  await loadDict();
  const w = String(input || '').trim().toLowerCase();
  if (!w) return null;
  const direct = entry(w);
  const baseWord = DICT.f[w];
  if (direct && !baseWord) return direct;
  if (baseWord) {
    const b = entry(baseWord);
    if (b) {
      // 原词条只是“xx的过去式”之类时，直接用原形释义
      const trivial = direct && direct.meaning.length < 40 && /(过去式|过去分词|现在分词|复数|比较级|最高级|第三人称)/.test(direct.meaning);
      if (!direct || trivial) return { ...b, word: w, base: baseWord };
      // 原词条有独立意思（如 "left"），合并显示
      return { ...b, word: w, base: baseWord, meaning: direct ? direct.meaning + '\n— ' + baseWord + ': ' + b.meaning : b.meaning, phon: direct?.phon || b.phon };
    }
  }
  if (direct) return direct;
  for (const g of guessLemmas(w)) {
    const b = entry(g);
    if (b) return { ...b, word: w, base: g };
  }
  return null;
}

/** 用 iPad 自带语音朗读（离线可用） */
export function speak(text) {
  try {
    if (!('speechSynthesis' in window) || !text) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.9;
    speechSynthesis.speak(u);
  } catch (_) {}
}
