// ============================================================
//  logic.js — 纯计算，不碰界面和存储。打卡规则都在这里。
// ============================================================

const pad = (n) => String(n).padStart(2, '0');

/** 时间戳/Date → 'YYYY-MM-DD'（本地时区） */
export function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function keyToDate(k) {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}
export function addDays(k, n) {
  const d = keyToDate(k);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}
export const weekday = (k) => keyToDate(k).getDay();

/** 进行中计时的净毫秒数（扣除暂停） */
export function activeNetMs(active, now) {
  if (!active) return 0;
  let ms = now - active.start;
  for (const p of active.pauses || []) ms -= (p.end ?? now) - p.start;
  return Math.max(0, ms);
}
export function isPaused(active) {
  const p = active?.pauses?.[active.pauses.length - 1];
  return !!p && p.end == null;
}
export function pausedMs(active, now) {
  const p = active?.pauses?.[active.pauses.length - 1];
  return p && p.end == null ? now - p.start : 0;
}

/** 每天的总分钟数和按技能分布 */
export function totalsByDay(sessions, subjects) {
  const skillOf = Object.fromEntries(subjects.map((s) => [s.id, s.skill]));
  const out = {};
  for (const s of sessions) {
    const d = (out[s.date] ||= { total: 0, bySkill: {}, count: 0 });
    const sk = skillOf[s.subjectId] || 'other';
    d.total += s.minutes;
    d.count += 1;
    d.bySkill[sk] = (d.bySkill[sk] || 0) + s.minutes;
  }
  return out;
}

/**
 * 从第一条记录逐天回放，算出：当前连续天数、最长连续、补签卡数、每天状态。
 * 状态：done 打卡 | bonus 休息日也打卡(⭐) | makeup 补签 | rest 休息日 | pending 今天未完成 | missed 中断
 */
export function computeStreak({ sessions, subjects, makeups, settings, today }) {
  const totals = totalsByDay(sessions, subjects);
  const made = new Set((makeups || []).map((m) => m.date));
  const keys = [...Object.keys(totals), ...made].filter((k) => k <= today).sort();
  const res = { current: 0, best: 0, cards: 0, days: {}, totals };
  if (!keys.length) return res;

  const rest = new Set(settings.restDays);
  let streak = 0, best = 0, cards = 0;
  for (let k = keys[0]; k <= today; k = addDays(k, 1)) {
    const m = totals[k]?.total || 0;
    const isRest = rest.has(weekday(k));
    let status;
    if (m >= settings.checkinMinutes) {
      streak++;
      status = isRest ? 'bonus' : 'done';
      if (streak % settings.cardEvery === 0) cards = Math.min(settings.cardMax, cards + 1);
    } else if (made.has(k) && !isRest) {
      streak++;
      status = 'makeup';
      cards = Math.max(0, cards - 1);
    } else if (isRest) {
      status = 'rest';
    } else if (k === today) {
      status = 'pending';
    } else {
      streak = 0;
      status = 'missed';
    }
    best = Math.max(best, streak);
    res.days[k] = { minutes: m, status, rest: isRest };
  }
  res.current = streak;
  res.best = best;
  res.cards = cards;
  return res;
}

/** 可以用补签卡的日子：最近 makeupWindow 天内、状态为 missed 的学习日 */
export function makeupCandidates(streakRes, settings, today) {
  if (streakRes.cards <= 0) return [];
  const out = [];
  for (let i = 1; i <= settings.makeupWindow; i++) {
    const k = addDays(today, -i);
    if (streakRes.days[k]?.status === 'missed') out.push(k);
  }
  return out;
}

/** 距离下一张补签卡还差几天（已满返回 0） */
export function daysToNextCard(streakRes, settings) {
  if (streakRes.cards >= settings.cardMax) return 0;
  return settings.cardEvery - (streakRes.current % settings.cardEvery);
}

/** 最近 n 天的 key 列表（旧 → 新） */
export function lastNDays(today, n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) out.push(addDays(today, -i));
  return out;
}

/** 词形猜测（字典里没有对应关系时的兜底） */
export function guessLemmas(w) {
  const c = [];
  if (w.endsWith('ies')) c.push(w.slice(0, -3) + 'y');
  if (w.endsWith('ied')) c.push(w.slice(0, -3) + 'y');
  if (w.endsWith('es')) c.push(w.slice(0, -2));
  if (w.endsWith('s')) c.push(w.slice(0, -1));
  if (w.endsWith('ed')) c.push(w.slice(0, -2), w.slice(0, -1));
  if (w.endsWith('ing')) c.push(w.slice(0, -3), w.slice(0, -3) + 'e');
  if (/(.)\1(ed|ing)$/.test(w)) c.push(w.replace(/(.)\1(ed|ing)$/, '$1'));
  if (w.endsWith('er')) c.push(w.slice(0, -2), w.slice(0, -1));
  if (w.endsWith('est')) c.push(w.slice(0, -3), w.slice(0, -2));
  if (w.endsWith('ly')) c.push(w.slice(0, -2));
  return c.filter((x) => x.length > 1);
}

// ---------------- 玩（时间感练习）----------------
// plays: [{id, cat, date, start, end, minutes, guess|null, note}]  — 与学习记录分开，不参与打卡/连续天数。

/** 每天玩的总分钟数和按类别分布 */
export function playTotalsByDay(plays) {
  const out = {};
  for (const p of plays) {
    const d = (out[p.date] ||= { total: 0, byCat: {}, count: 0 });
    d.total += p.minutes;
    d.count += 1;
    d.byCat[p.cat] = (d.byCat[p.cat] || 0) + p.minutes;
  }
  return out;
}

/** 估计偏差：(猜 − 实际) / 实际。负数 = 少估（觉得比实际短） */
export const guessBias = (guess, actual) => (actual > 0 ? (guess - actual) / actual : 0);

/** 有猜测的记录（旧→新） */
export function guessed(recs) {
  return recs.filter((r) => Number.isFinite(r.guess) && r.guess > 0 && r.minutes > 0).sort((a, b) => a.start - b.start);
}

/** 汇总：次数 + 平均偏差（取最近 last 次，默认全部）。n < minN 时 ready=false，界面先不下结论。 */
export function senseSummary(recs, minN = 5, last = Infinity) {
  const g = guessed(recs).slice(-last);
  const n = g.length;
  const avg = n ? g.reduce((a, r) => a + guessBias(r.guess, r.minutes), 0) / n : 0;
  return { n, avg, ready: n >= minN };
}
