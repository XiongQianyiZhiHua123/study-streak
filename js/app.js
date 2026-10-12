// ============================================================
//  app.js — 页面与交互
// ============================================================
import { APP_VERSION, SKILLS, PALETTES, PALETTE_KEYS, PLAY_COLORS } from './config.js';
import { store, uid } from './store.js';
import { t, setLang, getLang, fmtMin, fmtDate, fmtMonth } from './i18n.js';
import {
  dayKey, addDays, keyToDate, activeNetMs, isPaused, pausedMs,
  computeStreak, makeupCandidates, daysToNextCard, lastNDays,
  playTotalsByDay, guessBias, guessed, senseSummary,
} from './logic.js';
import { lookup, loadDict, speak } from './dict.js';
import { drawBarChart } from './chart.js';

// ---------- 小工具 ----------
const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nl2br = (s) => esc(s).replace(/\n/g, '<br>');
const D = () => store.data;
const S = () => store.data.settings;
const today = () => dayKey(Date.now());
const pad = (n) => String(n).padStart(2, '0');
const clampInt = (v, lo, hi, dflt) => { const n = parseInt(v, 10); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : dflt; };

const ui = {
  tab: 'today', range: 7, calMonth: null, wordFilter: 'all', wordQuery: '',
  timerOpen: true, chartKind: 'study', statsKind: 'study', guess: null, lastDay: null, pending: null, flash: null, dayOpen: null,
};

function subj(id) {
  return D().subjects.find((s) => s.id === id) || { id, emoji: '❓', skill: 'other', name: { en: id, zh: id } };
}
const sName = (s) => s.name[getLang()] || s.name.zh || s.name.en || '';
const skillName = (id) => t('skill.' + id);

// ---- 玩：类别与颜色 ----
const catOf = (id) => D().playCats.find((c) => c.id === id) || { id, ci: 3, emoji: '🎲', name: { en: id, zh: id } };
const catName = (c) => c.name[getLang()] || c.name.zh || c.name.en || '';
const catVar = (c) => `var(--play-${(c.ci ?? 3) % PLAY_COLORS})`;
const catColor = (id) => catVar(catOf(id));
const visCats = () => D().playCats.filter((c) => !c.hidden);
const playMinutesOn = (k) => D().plays.filter((p) => p.date === k).reduce((a, p) => a + p.minutes, 0);
const streak = () => computeStreak({ sessions: D().sessions, subjects: D().subjects, makeups: D().makeups, settings: S(), today: today() });
const save = () => { if (!store.save()) toast('⚠️ Save failed'); };

function fmtClock(ms) {
  const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
  return h ? `${h}:${pad(m)}:${pad(ss)}` : `${pad(m)}:${pad(ss)}`;
}
const timeOf = (ts) => { const d = new Date(ts); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };

// ---------- 提示与弹窗 ----------
let toastTimer;
function toast(msg, ms = 2400) {
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.classList.remove('show'); setTimeout(() => (el.hidden = true), 250); }, ms);
}
function openModal(html, { onMount, cls = '' } = {}) {
  const m = $('#modal');
  m.innerHTML = `<div class="sheet ${cls}" role="dialog" aria-modal="true">${html}</div>`;
  m.hidden = false;
  document.body.classList.add('modal-open');
  onMount?.(m.firstElementChild);
}
function closeModal() {
  const m = $('#modal');
  m.hidden = true;
  m.innerHTML = '';
  document.body.classList.remove('modal-open');
}
const modalOpen = () => !$('#modal').hidden;

/** 页面内确认框（替代 confirm()，在任何环境都能用） */
function ask(msg, onYes, onNo) {
  ui.confirm = { onYes, onNo };
  openModal(`<p class="remind">${esc(msg)}</p>
    <div class="sheet-actions"><button class="btn btn-ghost" data-action="confirm-no">${t('common.cancel')}</button>
    <button class="btn btn-danger" data-action="confirm-yes">${t('common.confirm')}</button></div>`);
}

// ============================================================
//  渲染
// ============================================================
const TABS = [
  ['today', '🏠'], ['stats', '📊'], ['words', '🔤'], ['settings', '⚙️'],
];

function applyTheme() {
  const r = document.documentElement;
  const mode = S().theme || 'auto';
  if (mode === 'auto') r.removeAttribute('data-app-theme'); else r.setAttribute('data-app-theme', mode);
  const p = PALETTES.find((x) => x.id === S().palette) || PALETTES[0];
  for (const k of PALETTE_KEYS) {
    r.style.setProperty(`--${k}-l`, p.light[k]);
    r.style.setProperty(`--${k}-d`, p.dark[k]);
  }
}

function render() {
  setLang(S().lang);
  applyTheme();
  document.title = t('appName');
  $('#tabs').innerHTML = TABS.map(([id, ic]) =>
    `<button class="tab ${ui.tab === id ? 'on' : ''}" data-action="tab" data-tab="${id}"><span class="tab-ic">${ic}</span><span>${t('tab.' + id)}</span></button>`).join('');
  $('#view').innerHTML = VIEWS[ui.tab]();
  AFTER[ui.tab]?.();
  renderTimer();
}

// ---------- 今天 ----------
function viewToday() {
  const k = today();
  const res = streak();
  const st = S();
  const tot = res.totals[k]?.total || 0;
  const isRest = st.restDays.includes(keyToDate(k).getDay());
  const toNext = daysToNextCard(res, st);
  let status;
  if (tot >= st.goalMinutes) status = t('today.goalDone');
  else if (tot >= st.checkinMinutes) status = isRest ? t('today.restChecked') : t('today.checked', { n: fmtMin(st.goalMinutes - tot) });
  else if (isRest) status = t('today.restDay', { n: st.checkinMinutes });
  else status = t('today.toCheckin', { n: fmtMin(st.checkinMinutes - tot) });

  const pct = Math.min(100, (tot / st.goalMinutes) * 100);
  const mark = Math.min(100, (st.checkinMinutes / st.goalMinutes) * 100);

  const cands = makeupCandidates(res, st, k);
  const makeup = cands.length ? `<div class="banner">
      <span>🛡️ ${t('makeup.banner', { date: fmtDate(cands[0]), n: res.cards })}</span>
      <button class="btn btn-small" data-action="makeup" data-date="${cands[0]}">${t('makeup.use')}</button></div>` : '';

  const last = st.lastBackup || D().createdAt;
  const backup = D().sessions.length >= 5 && Date.now() - last > 30 * 864e5
    ? `<div class="banner banner-soft" data-action="tab" data-tab="settings"><span>💾 ${t('backup.remind')}</span></div>` : '';

  const sessions = D().sessions.filter((s) => s.date === k).sort((a, b) => a.start - b.start);
  const list = sessions.length ? sessions.map((s) => sessionRow(s, true)).join('') : `<p class="muted empty">${t('today.noSessions')}</p>`;

  const startBtn = D().active
    ? `<button class="start-btn running" data-action="expand">⏱ ${t('today.resume')} · <span data-clock>${fmtClock(activeNetMs(D().active, Date.now()))}</span></button>`
    : `<button class="start-btn" data-action="start">▶&nbsp; ${t('today.start')}</button>`;

  return `
  <header class="page-head"><h1>${t('today.title')}</h1><p class="muted">${fmtDate(k, 'long')}</p></header>
  <div class="split"><div class="col">
  <section class="tiles">
    <div class="tile tile-fire"><div class="tile-ic">🔥</div><div class="tile-num">${res.current}</div>
      <div class="tile-label">${t('streak.days')}</div><div class="tile-sub">${t('streak.best', { n: res.best })}</div></div>
    <div class="tile"><div class="tile-ic">🛡️</div><div class="tile-num">${res.cards}<small> / ${st.cardMax}</small></div>
      <div class="tile-label">${t('cards.label')}</div><div class="tile-sub">${toNext ? t('cards.next', { n: toNext }) : t('cards.full')}</div></div>
    <div class="tile tile-wide"><div class="tile-ic">⏱</div><div class="tile-num">${fmtMin(tot)}</div>
      <div class="tile-label">${t('today.minutes')}</div>
      <div class="progress"><div class="progress-fill ${tot >= st.checkinMinutes ? 'ok' : ''}" style="width:${pct}%"></div>
        <div class="progress-mark" style="left:${mark}%"></div></div>
      <div class="progress-labels"><span style="left:${mark}%">${t('today.lineCheckin')} ${st.checkinMinutes}</span><span style="left:100%">${t('today.lineGoal')} ${st.goalMinutes}</span></div>
      <div class="tile-sub status">${status}</div></div>
  </section>
  ${makeup}${backup}
  ${startBtn}
  ${playRowHTML(k)}
  </div><div class="col">
  <section class="card">
    <div class="card-head"><h2>${t('today.week')}</h2>
      <button class="link-btn" data-action="tab" data-tab="stats">${t('today.moreStats')} ›</button></div>
    ${kindSeg('chartKind')}
    ${ui.chartKind === 'play' ? playLegendHTML() : legendHTML()}
    <div id="chart" class="chart chart-sm"></div>
  </section>
  <section class="card"><div class="card-head"><h2>${t('today.sessions')}</h2>
      <button class="btn btn-small" data-action="sess-new" data-date="${k}">＋ ${t('day.add')}</button></div>
    <ul class="sess-list">${list}</ul></section>
  ${playListHTML(k)}
  <section class="card"><h2>${t('today.reflection')}</h2>
    <textarea data-reflect="${k}" rows="4" placeholder="${esc(t('today.reflectionPh'))}">${esc(D().reflections[k] || '')}</textarea></section>
  </div></div>`;
}

function kindSeg(field) {
  const v = ui[field];
  return `<div class="seg seg-small seg-kind"><button data-action="kind" data-f="${field}" data-k="study" class="${v === 'study' ? 'on' : ''}">${t('chart.kindStudy')}</button>
    <button data-action="kind" data-f="${field}" data-k="play" class="${v === 'play' ? 'on' : ''}">${t('chart.kindPlay')}</button></div>`;
}
function playLegendHTML() {
  return `<div class="legend">${visCats().map((c) => `<span class="lg"><span class="sw" style="background:${catVar(c)}"></span>${esc(catName(c))}</span>`).join('')}</div>`;
}
function playRowHTML(k) {
  const run = D().playActive;
  const mins = playMinutesOn(k);
  const sub = run ? t('play.running') : mins ? t('play.today', { n: fmtMin(mins) }) : t('play.todayNone');
  return `<button class="play-row ${run ? 'running' : ''}" data-action="${run ? 'play-expand' : 'play-open'}">
    <span class="play-ic">🎮</span><span class="play-main"><b>${t('play.row')}</b><small>${esc(sub)}</small></span>
    <span class="play-go">${run ? t('play.resume') : t('play.start')}</span></button>`;
}
function playRecRow(p) {
  const c = catOf(p.cat);
  const tag = Number.isFinite(p.guess) ? `<span class="pill">${t('play.guessTag', { g: fmtMin(p.guess) })}</span>` : '';
  return `<li class="sess"><span class="sess-ic" style="--c:${catVar(c)}">${c.emoji}</span>
    <div class="sess-main"><div class="sess-top"><b>${esc(catName(c))}</b><span class="muted">${timeOf(p.start)}</span>${tag}</div>
    ${p.note ? `<div class="sess-note">${nl2br(p.note)}</div>` : ''}</div>
    <span class="sess-min">${fmtMin(p.minutes)}</span>
    <div class="row-acts"><button class="icon-btn danger" data-action="play-del" data-id="${p.id}" aria-label="${t('common.delete')}">🗑</button></div></li>`;
}
function playListHTML(k) {
  const list = D().plays.filter((p) => p.date === k).sort((a, b) => a.start - b.start);
  if (!list.length) return '';
  return `<section class="card" id="play-list"><h2>${t('play.today.list')}</h2><ul class="sess-list">${list.map(playRecRow).join('')}</ul></section>`;
}

function sessionRow(s, editable = false) {
  const sb = subj(s.subjectId);
  const stars = s.stars ? `<span class="stars-mini">${'★'.repeat(s.stars)}</span>` : '';
  const acts = editable ? `<div class="row-acts"><button class="icon-btn" data-action="sess-edit" data-id="${s.id}" aria-label="${t('common.edit')}">✎</button>
      <button class="icon-btn danger" data-action="sess-del" data-id="${s.id}" aria-label="${t('common.delete')}">🗑</button></div>` : '';
  return `<li class="sess"><span class="sess-ic" style="--c:var(--skill-${sb.skill})">${sb.emoji}</span>
    <div class="sess-main"><div class="sess-top"><b>${esc(sName(sb))}</b><span class="muted">${timeOf(s.start)}</span>${stars}</div>
    ${s.note ? `<div class="sess-note">${nl2br(s.note)}</div>` : ''}</div>
    <span class="sess-min">${fmtMin(s.minutes)}</span>${acts}</li>`;
}

// ---------- 统计 ----------
function viewStats() {
  if (ui.statsKind === 'play') return viewStatsPlay();
  const k = today();
  const res = streak();
  const st = S();
  const n = ui.range;
  const keys = lastNDays(k, n);
  let total = 0, checkDays = 0, goalDays = 0;
  const bySkill = {};
  for (const d of keys) {
    const tt = res.totals[d];
    if (!tt) continue;
    total += tt.total;
    if (tt.total >= st.checkinMinutes) checkDays++;
    if (tt.total >= st.goalMinutes) goalDays++;
    for (const [sk, v] of Object.entries(tt.bySkill)) bySkill[sk] = (bySkill[sk] || 0) + v;
  }
  const maxSk = Math.max(1, ...Object.values(bySkill));
  const skillRows = SKILLS.filter((s) => bySkill[s.id]).map((s) => `
    <li class="sk-row"><span class="sk-name"><span class="sw" style="background:var(--skill-${s.id})"></span>${s.icon} ${skillName(s.id)}</span>
      <span class="sk-bar"><span style="width:${(bySkill[s.id] / maxSk) * 100}%;background:var(--skill-${s.id})"></span></span>
      <span class="sk-val">${fmtMin(bySkill[s.id])}<small> · ${Math.round((bySkill[s.id] / total) * 100)}%</small></span></li>`).join('');

  const table = keys.slice().reverse().map((d) => `<tr><td>${fmtDate(d)}</td><td>${Math.round(res.totals[d]?.total || 0)}</td>
     <td>${statusLabel(res.days[d]?.status)}</td></tr>`).join('');

  return `
  <header class="page-head"><h1>${t('stats.title')}</h1></header>
  ${statsBar(n)}
  <section class="tiles tiles-4">
    <div class="tile"><div class="tile-label">${t('stats.total')}</div><div class="tile-num">${fmtMin(total)}</div></div>
    <div class="tile"><div class="tile-label">${t('stats.avg')}</div><div class="tile-num">${fmtMin(total / n)}</div></div>
    <div class="tile"><div class="tile-label">${t('stats.checkinDays')}</div><div class="tile-num">${checkDays}<small> / ${n}</small></div></div>
    <div class="tile"><div class="tile-label">${t('stats.goalDays')}</div><div class="tile-num">${goalDays}<small> / ${n}</small></div></div>
  </section>
  <section class="card">
    <h2>${t('stats.chartTitle')}</h2>
    ${legendHTML()}
    <div id="chart" class="chart"></div>
    <details class="table-wrap"><summary>${t('stats.table')}</summary>
      <table><thead><tr><th>${t('stats.date')}</th><th>${t('stats.minutes')}</th><th></th></tr></thead><tbody>${table}</tbody></table></details>
  </section>
  <div class="split split-even"><div class="col">
  <section class="card">${calendarHTML(res)}</section></div><div class="col">
  ${skillRows ? `<section class="card"><h2>${t('stats.bySkill')}</h2><ul class="sk-list">${skillRows}</ul></section>` : ''}
  </div></div>`;
}

function statsBar(n) {
  return `<div class="stats-bar" style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">${kindSeg('statsKind')}
  <div class="seg">
    <button class="${n === 7 ? 'on' : ''}" data-action="range" data-n="7">${t('stats.days7')}</button>
    <button class="${n === 30 ? 'on' : ''}" data-action="range" data-n="30">${t('stats.days30')}</button>
  </div></div>`;
}

// ---------- 统计：玩 ----------
function viewStatsPlay() {
  const k = today();
  const n = ui.range;
  const keys = lastNDays(k, n);
  const tot = playTotalsByDay(D().plays);
  let total = 0, days = 0, count = 0;
  for (const d of keys) { const x = tot[d]; if (!x) continue; total += x.total; days++; count += x.count; }
  const studyTotal = keys.reduce((a, d) => a + (streak().totals[d]?.total || 0), 0);
  const maxv = Math.max(studyTotal, total, 1);
  const table = keys.slice().reverse().map((d) => `<tr><td>${fmtDate(d)}</td><td>${Math.round(tot[d]?.total || 0)}</td></tr>`).join('');
  return `
  <header class="page-head"><h1>${t('stats.title')}</h1></header>
  ${statsBar(n)}
  <section class="tiles tiles-4">
    <div class="tile"><div class="tile-label">${t('pstats.total')}</div><div class="tile-num">${fmtMin(total)}</div></div>
    <div class="tile"><div class="tile-label">${t('pstats.avg')}</div><div class="tile-num">${fmtMin(total / n)}</div></div>
    <div class="tile"><div class="tile-label">${t('pstats.days')}</div><div class="tile-num">${days}<small> / ${n}</small></div></div>
    <div class="tile"><div class="tile-label">${t('pstats.per')}</div><div class="tile-num">${count ? fmtMin(total / count) : '–'}</div></div>
  </section>
  <section class="card">
    <h2>${t('pstats.chartTitle')}</h2>
    ${playLegendHTML()}
    <div id="chart" class="chart"></div>
    <p class="muted small">${t('pstats.chartNote')}</p>
    <details class="table-wrap"><summary>${t('stats.table')}</summary>
      <table><thead><tr><th>${t('stats.date')}</th><th>${t('stats.minutes')}</th></tr></thead><tbody>${table}</tbody></table></details>
  </section>
  <div class="split split-even"><div class="col">
  <section class="card"><h2>${t('pstats.vs')}</h2>
    <div class="vs-row"><span>${t('pstats.study')}</span><div class="vs-bar" style="width:${(studyTotal / maxv) * 60}%;background:var(--accent)"></div><b>${fmtMin(studyTotal)}</b></div>
    <div class="vs-row"><span>${t('pstats.play')}</span><div class="vs-bar" style="width:${(total / maxv) * 60}%;background:var(--play-0)"></div><b>${fmtMin(total)}</b></div>
    <p class="muted small">${t('pstats.vsNote')}</p></section></div><div class="col">
  ${senseHTML()}
  </div></div>`;
}

// ---------- 时间感小实验 ----------
function senseHTML() {
  const min = S().guessMinSessions;
  const recs = guessed(D().plays);
  const sum = senseSummary(D().plays, min);
  let body;
  if (!recs.length) body = `<p class="muted">${t('sense.none')}</p>`;
  else {
    const rows = recs.slice(-8);
    const maxV = Math.max(...rows.flatMap((r) => [r.guess, r.minutes]));
    const top = Math.max(90, Math.ceil(maxV / 30) * 30);
    const x0 = 120, x1 = 740, px = (v) => x0 + (v / top) * (x1 - x0);
    const rowH = 46, H = rows.length * rowH + 40;
    let g = '';
    for (let v = 0; v <= top; v += 30) g += `<line class="c-grid" x1="${px(v)}" x2="${px(v)}" y1="6" y2="${H - 30}"/><text class="s-axis" x="${px(v)}" y="${H - 10}" text-anchor="middle">${v}${v === top ? ' ' + t('sense.min') : ''}</text>`;
    rows.forEach((r, i) => {
      const y = 28 + i * rowH, c = catColor(r.cat), d = new Date(r.start);
      g += `<text class="s-lab" x="0" y="${y + 4}">${d.getMonth() + 1}/${d.getDate()} ${esc(catName(catOf(r.cat)).slice(0, 4))}</text>`;
      g += `<line x1="${px(r.guess)}" x2="${px(r.minutes)}" y1="${y}" y2="${y}" stroke="${c}" stroke-width="3" stroke-linecap="round" opacity=".45"/>`;
      g += `<circle cx="${px(r.guess)}" cy="${y}" r="7" fill="var(--surface)" stroke="${c}" stroke-width="3"/>`;
      g += `<circle cx="${px(r.minutes)}" cy="${y}" r="8" fill="${c}"/>`;
      g += `<text class="s-val" x="${Math.max(px(r.guess), px(r.minutes)) + 14}" y="${y + 4}">${r.minutes}</text>`;
    });
    const dots = `<svg width="14" height="14"><circle cx="7" cy="7" r="5" fill="none" stroke="var(--play-0)" stroke-width="2"/></svg>`;
    const dot2 = `<svg width="14" height="14"><circle cx="7" cy="7" r="6" fill="var(--play-0)"/></svg>`;
    body = `<p class="muted small">${t('sense.intro')}</p>
      <div class="legend"><span class="lg">${dots}${t('sense.lgGuess')}</span><span class="lg">${dot2}${t('sense.lgActual')}</span></div>
      <div class="sense-wrap"><svg viewBox="0 0 760 ${H}" role="img" aria-label="${esc(t('sense.title'))}">${g}</svg></div>`;
  }
  let summary = '';
  if (recs.length && sum.ready) {
    const p = Math.round(Math.abs(sum.avg) * 100);
    const less = sum.avg < -0.03, more = sum.avg > 0.03;
    summary = `<div class="sense-sum"><b>${less ? t('sense.sumLess', { p }) : more ? t('sense.sumMore', { p }) : t('sense.sumEven')}</b>
      <span class="muted small">${less ? t('sense.sumLessHint') : more ? t('sense.sumMoreHint') : ''}</span></div>`;
  } else if (recs.length) summary = `<div class="sense-muted">${t('sense.need', { n: min - sum.n })}</div>`;
  // 学习的猜测
  let study = '';
  if (S().studyGuess) {
    const ss = senseSummary(D().sessions, 1);
    if (ss.n) {
      const p = Math.round(Math.abs(ss.avg) * 100);
      const line = Math.abs(ss.avg) <= 0.03 ? t('sense.studyEvenLine', { n: ss.n })
        : t('sense.studyLine', { n: ss.n, d: ss.avg < 0 ? t('sense.studyLess') : t('sense.studyMore'), p });
      study = `<div class="sense-muted" style="color:var(--text-2)">${line}</div>`;
    }
  } else study = `<div class="sense-muted">🔒 ${t('sense.studyOff')}</div>`;
  return `<section class="card"><h2>${t('sense.title')}</h2>${body}${summary}${study}</section>`;
}

function legendHTML() {
  return `<div class="legend">${SKILLS.map((s) => `<span class="lg"><span class="sw" style="background:var(--skill-${s.id})"></span>${skillName(s.id)}</span>`).join('')}</div>`;
}

function statusLabel(s) {
  return { done: '🔥', bonus: '⭐', makeup: '🛡️', missed: '✗', rest: '–', pending: '…' }[s] || '';
}

function calendarHTML(res) {
  const k = today();
  if (!ui.calMonth) ui.calMonth = k.slice(0, 7);
  const [y, m] = ui.calMonth.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const daysIn = new Date(y, m, 0).getDate();
  let cells = '';
  for (let i = 0; i < first.getDay(); i++) cells += '<div class="cal-cell blank"></div>';
  for (let d = 1; d <= daysIn; d++) {
    const key = `${y}-${pad(m)}-${pad(d)}`;
    const info = res.days[key];
    const isRest = S().restDays.includes(new Date(y, m - 1, d).getDay());
    const cls = [info?.status || (key > k ? 'future' : 'none'), isRest ? 'rest-day' : '', key === k ? 'is-today' : ''].join(' ');
    const ic = info ? { done: '🔥', bonus: '⭐', makeup: '🛡️' }[info.status] || '' : '';
    const mins = info?.minutes ? `<span class="cal-min">${Math.round(info.minutes)}′</span>` : '';
    cells += `<div class="cal-cell ${cls}" data-action="day" data-date="${key}"><span class="cal-d">${d}</span><span class="cal-ic">${ic}</span>${mins}</div>`;
  }
  const head = [0, 1, 2, 3, 4, 5, 6].map((i) => `<div class="cal-h">${t('wdShort.' + i)}</div>`).join('');
  return `<div class="cal-top"><h2>${t('stats.calendar')}</h2>
      <div class="cal-nav"><button class="icon-btn" data-action="cal" data-d="-1">‹</button><span>${fmtMonth(y, m)}</span>
      <button class="icon-btn" data-action="cal" data-d="1">›</button></div></div>
    <div class="cal">${head}${cells}</div>
    <div class="cal-legend"><span>🔥 ${t('cal.done')}</span><span>⭐ ${t('cal.bonus')}</span><span>🛡️ ${t('cal.makeup')}</span>
      <span><i class="dot missed"></i>${t('cal.missed')}</span><span><i class="dot rest"></i>${t('cal.rest')}</span></div>`;
}

function drawStatsChart() { drawChart(ui.range, 260, ui.statsKind); }
function drawTodayChart() { drawChart(7, 210, ui.chartKind); }
function drawChart(n, height, kind = 'study') {
  const el = $('#chart');
  if (!el) return;
  if (kind === 'play') return drawPlayChart(el, n, height);
  const k = today();
  const res = streak();
  const rest = new Set(S().restDays);
  const days = lastNDays(k, n).map((d) => {
    const dt = keyToDate(d);
    return {
      key: d,
      label: n <= 10 ? t('wdShort.' + dt.getDay()) : String(dt.getDate()),
      sub: n <= 10 ? `${dt.getMonth() + 1}/${dt.getDate()}` : '',
      total: res.totals[d]?.total || 0,
      bySkill: res.totals[d]?.bySkill || {},
      rest: rest.has(dt.getDay()),
      isToday: d === k,
      tip: fmtDate(d),
    };
  });
  drawBarChart(el, {
    days,
    skills: SKILLS.map((s) => ({ id: s.id, name: skillName(s.id) })),
    checkin: S().checkinMinutes, goal: S().goalMinutes,
    labels: { checkin: t('today.lineCheckin'), goal: t('today.lineGoal'), view: t('chart.viewDay') },
    height,
    fmt: fmtMin,
  });
}

function drawPlayChart(el, n, height) {
  const k = today();
  const tot = playTotalsByDay(D().plays);
  const rest = new Set(S().restDays);
  const keys = lastNDays(k, n);
  const days = keys.map((d) => {
    const dt = keyToDate(d);
    return {
      key: d,
      label: n <= 10 ? t('wdShort.' + dt.getDay()) : String(dt.getDate()),
      sub: n <= 10 ? `${dt.getMonth() + 1}/${dt.getDate()}` : '',
      total: tot[d]?.total || 0, bySkill: tot[d]?.byCat || {},
      rest: rest.has(dt.getDay()), isToday: d === k, tip: fmtDate(d),
    };
  });
  const sum = days.reduce((a, d) => a + d.total, 0);
  drawBarChart(el, {
    days,
    skills: D().playCats.map((c) => ({ id: c.id, name: catName(c) })),
    color: catColor, hideRefs: true, noView: true,
    avg: sum ? { value: sum / n, label: t('pstats.avgLine', { n: Math.round(sum / n) }) } : null,
    checkin: 0, goal: 0, labels: { view: '' }, height, fmt: fmtMin,
  });
}

// ---------- 某一天的详情（从图表/日历打开） ----------
function openDay(date) {
  ui.dayOpen = date;
  const res = streak();
  const st = res.days[date]?.status;
  const sessions = D().sessions.filter((s) => s.date === date).sort((a, b) => a.start - b.start);
  const tot = res.totals[date]?.total || 0;
  openModal(`
    <div class="sheet-head"><h2>${fmtDate(date, 'long')}</h2><button class="icon-btn" data-action="day-close" aria-label="${t('common.close')}">✕</button></div>
    <p class="muted">${statusLabel(st)} ${fmtMin(tot)}</p>
    <h3>${t('day.reflection')}</h3>
    <textarea data-reflect="${date}" rows="3" placeholder="${esc(t('today.reflectionPh'))}">${esc(D().reflections[date] || '')}</textarea>
    <h3>${t('day.sessions')}</h3>
    ${sessions.length ? `<ul class="sess-list">${sessions.map((s) => sessionRow(s, true)).join('')}</ul>` : `<p class="muted">${t('day.none')}</p>`}
    <button class="btn" data-action="sess-new" data-date="${date}">＋ ${t('day.add')}</button>`);
}

function subjectOptions(selected) {
  return SKILLS.map((sk) => {
    const opts = D().subjects.filter((s) => s.skill === sk.id && (!s.hidden || s.id === selected))
      .map((s) => `<option value="${s.id}" ${s.id === selected ? 'selected' : ''}>${s.emoji} ${esc(sName(s))}</option>`).join('');
    return opts ? `<optgroup label="${skillName(sk.id)}">${opts}</optgroup>` : '';
  }).join('');
}

function starsHTML(v) {
  return `<div class="stars" data-v="${v}">${[1, 2, 3, 4, 5].map((i) => `<button type="button" class="star ${i <= v ? 'on' : ''}" data-action="star" data-v="${i}">★</button>`).join('')}</div>`;
}

function openSessForm(id, date) {
  const s = id ? D().sessions.find((x) => x.id === id) : null;
  const start = s ? new Date(s.start) : null;
  const firstVisible = D().subjects.find((x) => !x.hidden)?.id;
  openModal(`
    <div class="sheet-head"><h2>${s ? t('sess.edit') : t('sess.new')}</h2></div>
    <label class="field">${t('sess.subject')}<select id="f-subj">${subjectOptions(s ? s.subjectId : firstVisible)}</select></label>
    <div class="field-row">
      <label class="field">${t('sess.date')}<input type="date" id="f-date" value="${s ? s.date : date}" max="${today()}"></label>
      <label class="field">${t('sess.time')}<input type="time" id="f-time" value="${start ? timeOf(s.start) : '16:00'}"></label>
      <label class="field">${t('sess.minutes')}<input type="number" id="f-min" inputmode="numeric" min="1" max="600" value="${s ? s.minutes : 30}"></label>
    </div>
    <label class="field">${t('sum.note')}<textarea id="f-note" rows="3">${esc(s?.note || '')}</textarea></label>
    <div class="field">${t('sum.stars')}${starsHTML(s?.stars || 0)}</div>
    <div class="sheet-actions"><button class="btn btn-ghost" data-action="sess-cancel">${t('common.cancel')}</button>
      <button class="btn btn-primary" data-action="sess-save" data-id="${s ? s.id : ''}">${t('common.save')}</button></div>`);
}

// ---------- 单词本 ----------
function filteredWords() {
  const q = ui.wordQuery.trim().toLowerCase();
  return D().words
    .filter((w) => ui.wordFilter === 'all' || (ui.wordFilter === 'mastered' ? w.mastered : !w.mastered))
    .filter((w) => !q || w.word.toLowerCase().includes(q) || (w.meaning || '').toLowerCase().includes(q))
    .sort((a, b) => b.createdAt - a.createdAt);
}
function wordItem(w) {
  return `<li class="word ${w.mastered ? 'is-mastered' : ''}">
    <div class="w-main"><div class="w-top"><b class="w-word">${esc(w.word)}</b>${w.phon ? `<span class="muted">/${esc(w.phon)}/</span>` : ''}
      <button class="icon-btn" data-action="speak" data-w="${esc(w.word)}" aria-label="speak">🔊</button></div>
      <div class="w-mean" data-action="w-edit" data-id="${w.id}">${nl2br(w.meaning || '—')}</div>
      <div class="w-meta muted">${fmtDate(w.date)}${w.subjectId ? ' · ' + esc(sName(subj(w.subjectId))) : ''}</div></div>
    <div class="w-acts">
      <button class="chk ${w.mastered ? 'on' : ''}" data-action="w-master" data-id="${w.id}" title="${w.mastered ? t('words.markLearning') : t('words.markMastered')}">✓</button>
      <button class="icon-btn danger" data-action="w-del" data-id="${w.id}" aria-label="${t('common.delete')}">🗑</button></div></li>`;
}
function viewWords() {
  const all = D().words;
  const mastered = all.filter((w) => w.mastered).length;
  const chips = ['all', 'learning', 'mastered'].map((f) =>
    `<button class="${ui.wordFilter === f ? 'on' : ''}" data-action="w-filter" data-f="${f}">${t('words.' + f)}</button>`).join('');
  return `<header class="page-head"><h1>${t('words.title')}</h1><p class="muted">${t('words.count', { n: all.length, m: mastered })}</p></header>
    <div class="w-tools">
      <button class="btn btn-primary" data-action="w-new">＋ ${t('words.new')}</button>
      <button class="btn" data-action="flash-start">🃏 ${t('words.flash')}</button>
    </div>
    <div class="w-filter"><input type="search" id="w-q" placeholder="${esc(t('words.searchPh'))}" value="${esc(ui.wordQuery)}"
      autocapitalize="off" autocorrect="off" spellcheck="false"><div class="seg seg-small">${chips}</div></div>
    <section class="card"><ul class="word-list" id="word-list">${wordListHTML()}</ul></section>`;
}
function wordListHTML() {
  const list = filteredWords();
  return list.length ? list.map(wordItem).join('') : `<p class="muted empty">${t('words.empty')}</p>`;
}

/** 单词输入组件：mode = 'pending'（结束记录时暂存）| 'direct'（直接存入单词本） */
function adderHTML(mode) {
  return `<div class="adder" data-mode="${mode}">
    <div class="adder-row"><input class="a-word" type="text" placeholder="${esc(t('words.inputPh'))}" autocapitalize="off" autocorrect="off" spellcheck="false" autocomplete="off">
      <button type="button" class="icon-btn" data-action="a-speak" aria-label="speak">🔊</button></div>
    <div class="a-info muted"></div>
    <textarea class="a-mean" rows="2" placeholder="${esc(t('words.meaningPh'))}"></textarea>
    <button type="button" class="btn" data-action="a-add">＋ ${t('words.add')}</button>
    <ul class="a-list"></ul></div>`;
}

let lookupTimer;
function onAdderInput(input) {
  const ad = input.closest('.adder');
  const info = $('.a-info', ad), mean = $('.a-mean', ad);
  clearTimeout(lookupTimer);
  const q = input.value.trim();
  ad.dataset.phon = '';
  if (!q) { info.textContent = ''; if (!mean.dataset.dirty) mean.value = ''; return; }
  lookupTimer = setTimeout(async () => {
    info.textContent = t('words.loading');
    let r = null;
    try { r = await lookup(q); } catch (_) {}
    if (input.value.trim() !== q) return;
    if (!r) { info.textContent = t('words.notFound'); if (!mean.dataset.dirty) mean.value = ''; return; }
    ad.dataset.phon = r.phon || '';
    info.innerHTML = `${r.phon ? `<span>/${esc(r.phon)}/</span>` : ''}${r.base ? ` <span class="base-hint">${t('words.baseHint', { w: esc(r.base) })}</span>
      <button type="button" class="link-btn" data-action="a-base" data-w="${esc(r.base)}">${t('words.useBase')}</button>` : ''}`;
    if (!mean.dataset.dirty) mean.value = r.meaning;
  }, 220);
}

function makeWord(word, meaning, phon, extra = {}) {
  return { id: uid(), word, phon: phon || '', meaning: meaning || '', date: today(), subjectId: null, sessionId: null, mastered: false, createdAt: Date.now(), ...extra };
}
const wordExists = (w, extra = []) => [...D().words, ...extra].some((x) => x.word.toLowerCase() === w.toLowerCase());

function adderAdd(btn) {
  const ad = btn.closest('.adder');
  const input = $('.a-word', ad), mean = $('.a-mean', ad);
  const word = input.value.trim();
  if (!word) { input.focus(); return; }
  const pend = ui.pending?.words || [];
  if (wordExists(word, ad.dataset.mode === 'pending' ? pend : [])) { toast(t('words.exists', { w: word })); return; }
  const extra = ad.dataset.mode === 'pending'
    ? { subjectId: ui.pending.subjectId, sessionId: ui.pending.sessionId, date: ui.pending.date }
    : { subjectId: D().active?.subjectId || null };
  const w = makeWord(word, mean.value.trim(), ad.dataset.phon, extra);
  if (ad.dataset.mode === 'pending') {
    pend.push(w);
    renderPending(ad);
  } else {
    D().words.push(w);
    save();
    $('.a-list', ad).insertAdjacentHTML('afterbegin', `<li><b>${esc(w.word)}</b> <span class="muted">${esc((w.meaning || '').split('\n')[0])}</span></li>`);
    toast(t('words.added', { w: word }));
  }
  input.value = ''; mean.value = ''; delete mean.dataset.dirty; $('.a-info', ad).textContent = ''; ad.dataset.phon = '';
  input.focus();
}
function renderPending(ad) {
  $('.a-list', ad).innerHTML = ui.pending.words.map((w, i) =>
    `<li><b>${esc(w.word)}</b> <span class="muted">${esc((w.meaning || '').split('\n')[0])}</span>
     <button type="button" class="icon-btn" data-action="a-remove" data-i="${i}">✕</button></li>`).join('');
}

function openWordAdd() {
  openModal(`<div class="sheet-head"><h2>${t('words.new')}</h2><button class="icon-btn" data-action="modal-close-render">✕</button></div>${adderHTML('direct')}`,
    { onMount: (el) => setTimeout(() => $('.a-word', el)?.focus(), 50) });
  loadDict().catch(() => {});
}

function openFlash() {
  const deck = D().words.filter((w) => !w.mastered).map((w) => w.id);
  for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  ui.flash = { deck, i: 0, flipped: false };
  renderFlash();
}
function renderFlash() {
  const f = ui.flash;
  const close = `<button class="icon-btn" data-action="modal-close-render">✕</button>`;
  if (!f.deck.length || f.i >= f.deck.length) {
    openModal(`<div class="sheet-head"><h2>${t('words.flash')}</h2>${close}</div>
      <p class="flash-done">${f.deck.length ? '🎉 ' + t('flash.done') : t('flash.none')}</p>
      <div class="sheet-actions"><button class="btn btn-primary" data-action="modal-close-render">${t('common.close')}</button></div>`);
    return;
  }
  const w = D().words.find((x) => x.id === f.deck[f.i]);
  if (!w) { f.i++; renderFlash(); return; }
  openModal(`<div class="sheet-head"><h2>${t('words.flash')} <small class="muted">${t('flash.progress', { i: f.i + 1, n: f.deck.length })}</small></h2>${close}</div>
    <div class="flash-card ${f.flipped ? 'flipped' : ''}" data-action="flip">
      <div class="flash-word">${esc(w.word)}</div>${w.phon ? `<div class="muted">/${esc(w.phon)}/</div>` : ''}
      ${f.flipped ? `<div class="flash-mean">${nl2br(w.meaning || '—')}</div>` : `<div class="muted flash-hint">${t('flash.tap')}</div>`}
    </div>
    <div class="sheet-actions">
      <button class="btn" data-action="speak" data-w="${esc(w.word)}">🔊</button>
      <button class="btn btn-ghost" data-action="flash-again">${t('flash.again')}</button>
      <button class="btn btn-primary" data-action="flash-know">${t('flash.know')}</button></div>`);
}

// ---------- 设置 ----------
function viewSettings() {
  const st = S();
  const restChips = [1, 2, 3, 4, 5, 6, 0].map((d) =>
    `<button class="${st.restDays.includes(d) ? 'on' : ''}" data-action="restday" data-d="${d}">${t('wd.' + d)}</button>`).join('');
  const subjects = SKILLS.map((sk) => {
    const rows = D().subjects.filter((s) => s.skill === sk.id).map((s) =>
      `<li class="subj-row ${s.hidden ? 'is-hidden' : ''}" data-action="subj-edit" data-id="${s.id}">
        <span class="sess-ic" style="--c:var(--skill-${s.skill})">${s.emoji}</span><span>${esc(sName(s))}</span>
        ${s.hidden ? `<span class="pill">${t('set.hidden')}</span>` : ''}<span class="chev">›</span></li>`).join('');
    return rows ? `<li class="subj-group"><span class="sw" style="background:var(--skill-${sk.id})"></span>${skillName(sk.id)}</li>${rows}` : '';
  }).join('');
  const lb = st.lastBackup ? t('set.lastBackup', { d: fmtDate(dayKey(st.lastBackup)) }) : t('set.never');
  return `<header class="page-head"><h1>${t('set.title')}</h1></header>
  <section class="card"><h2>${t('set.lang')}</h2>
    <div class="seg"><button class="${st.lang === 'zh' ? 'on' : ''}" data-action="lang" data-l="zh">中文</button>
      <button class="${st.lang === 'en' ? 'on' : ''}" data-action="lang" data-l="en">English</button></div></section>
  <section class="card"><h2>${t('set.theme')}</h2>
    <div class="seg">${['auto', 'light', 'dark'].map((m) => `<button class="${(st.theme || 'auto') === m ? 'on' : ''}" data-action="theme" data-m="${m}">${t('mode.' + m)}</button>`).join('')}</div>
    <h3>${t('set.palette')}</h3>
    <div class="palettes">${PALETTES.map((p) => {
      const vars = PALETTE_KEYS.map((k) => `--pv-${k}-l:${p.light[k]};--pv-${k}-d:${p.dark[k]}`).join(';');
      return `<button class="pal ${(st.palette || 'sky') === p.id ? 'on' : ''}" data-action="palette" data-p="${p.id}" style="${vars}">
        <span class="pal-demo"><span class="pal-card"><span class="pal-fire">🔥 12</span><span class="pal-line"></span><span class="pal-btn">▶</span></span></span>
        <span class="pal-chips">${PALETTE_KEYS.filter((k) => k !== 'surface2' && k !== 'line').map((k) => `<i style="background:var(--pv-${k})"></i>`).join('')}</span>
        <span class="pal-name">${t('palette.' + p.id)}</span></button>`;
    }).join('')}</div></section>
  <section class="card"><h2>${t('set.rules')}</h2>
    <div class="field-row">
      <label class="field">${t('set.checkin')}<input type="number" inputmode="numeric" min="1" max="600" data-setting="checkinMinutes" value="${st.checkinMinutes}"></label>
      <label class="field">${t('set.goal')}<input type="number" inputmode="numeric" min="1" max="600" data-setting="goalMinutes" value="${st.goalMinutes}"></label>
    </div>
    <h3>${t('set.restDays')}</h3><div class="chips">${restChips}</div><p class="muted small">${t('set.restHint')}</p></section>
  <section class="card"><div class="card-head"><h2>${t('set.play')} <span class="pill" style="background:var(--play-0);color:#fff">${t('set.new')}</span></h2></div>
    <div class="sw-row"><div><b>${t('set.playHide')}</b><small>${t('set.playHideHint')}</small></div>
      <button type="button" class="switch" role="switch" aria-checked="${!!st.playHideClock}" aria-label="${esc(t('set.playHide'))}" data-action="toggle" data-k="playHideClock"></button></div>
    <div class="sw-row"><div><b>${t('set.studyGuess')}</b><small>${t('set.studyGuessHint')}</small></div>
      <button type="button" class="switch" role="switch" aria-checked="${!!st.studyGuess}" aria-label="${esc(t('set.studyGuess'))}" data-action="toggle" data-k="studyGuess"></button></div>
    <h3>${t('set.playCats')}</h3>
    <div class="cat-chips">${D().playCats.map((c) => `<button class="cat-chip ${c.hidden ? 'is-hidden' : ''}" style="--c:${catVar(c)}" data-action="cat-edit" data-id="${c.id}"><span class="sw" style="background:${catVar(c)}"></span>${c.emoji} ${esc(catName(c))}</button>`).join('')}
      <button class="cat-chip add" data-action="cat-new">＋ ${t('set.addCat')}</button></div>
    <p class="muted small">${t('set.playNote')}</p></section>
  <section class="card"><div class="card-head"><h2>${t('set.subjects')}</h2>
    <button class="btn btn-small" data-action="subj-new">＋ ${t('set.addSubject')}</button></div>
    <ul class="subj-list">${subjects}</ul></section>
  <section class="card"><h2>${t('set.backup')}</h2>
    <p class="muted small">${t('set.backupHint')}</p><p class="small">${lb}</p>
    <div class="btn-row"><button class="btn btn-primary" data-action="export">💾 ${t('set.export')}</button>
      <button class="btn" data-action="import">📂 ${t('set.import')}</button></div></section>
  <section class="card"><h2>${t('set.about')}</h2>
    <p class="muted small">${t('appName')} · ${t('set.version', { v: APP_VERSION })}<br>${t('set.dictCredit')}</p></section>`;
}

function openCatForm(id) {
  const c = id ? D().playCats.find((x) => x.id === id) : null;
  openModal(`<div class="sheet-head"><h2>${c ? t('cat.edit') : t('cat.new')}</h2></div>
    <label class="field">${t('subj.nameZh')}<input id="ct-zh" value="${esc(c?.name.zh || '')}"></label>
    <label class="field">${t('subj.nameEn')}<input id="ct-en" value="${esc(c?.name.en || '')}"></label>
    <label class="field">${t('subj.emoji')}<input id="ct-emoji" maxlength="4" value="${esc(c?.emoji || '🎲')}"></label>
    ${c ? `<label class="field"><span><input type="checkbox" id="ct-hide" ${c.hidden ? 'checked' : ''}> ${t('cat.hide')}</span></label>` : ''}
    <div class="sheet-actions"><button class="btn btn-ghost" data-action="modal-close">${t('common.cancel')}</button>
      <button class="btn btn-primary" data-action="cat-save" data-id="${c ? c.id : ''}">${t('common.save')}</button></div>`);
}

function openSubjForm(id) {
  const s = id ? D().subjects.find((x) => x.id === id) : null;
  const skillOpts = SKILLS.map((sk) => `<option value="${sk.id}" ${s?.skill === sk.id ? 'selected' : ''}>${sk.icon} ${skillName(sk.id)}</option>`).join('');
  openModal(`<div class="sheet-head"><h2>${s ? t('subj.edit') : t('subj.new')}</h2></div>
    <div class="field-row">
      <label class="field">${t('subj.nameZh')}<input id="sj-zh" value="${esc(s?.name.zh || '')}"></label>
      <label class="field">${t('subj.nameEn')}<input id="sj-en" value="${esc(s?.name.en || '')}"></label>
    </div>
    <div class="field-row">
      <label class="field">${t('subj.emoji')}<input id="sj-emoji" value="${esc(s?.emoji || '📚')}" maxlength="4"></label>
      <label class="field">${t('subj.skill')}<select id="sj-skill">${skillOpts}</select></label>
    </div>
    ${s ? `<label class="check"><input type="checkbox" id="sj-hide" ${s.hidden ? 'checked' : ''}> ${t('subj.hide')}</label>` : ''}
    <div class="sheet-actions"><button class="btn btn-ghost" data-action="modal-close">${t('common.cancel')}</button>
      <button class="btn btn-primary" data-action="subj-save" data-id="${s ? s.id : ''}">${t('common.save')}</button></div>`);
}

async function doExport() {
  const json = store.exportJSON();
  const name = `study-streak-backup-${today()}.json`;
  const file = new File([json], name, { type: 'application/json' });
  const mark = () => { S().lastBackup = Date.now(); save(); render(); };
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: name });
      mark();
      return;
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  mark();
}

// ============================================================
//  计时
// ============================================================
function renderTimer() {
  const a = D().active;
  const ov = $('#timer'), mini = $('#mini');
  if (!a && D().playActive) return renderPlayTimer(ov, mini, D().playActive);
  if (!a) { ov.hidden = true; mini.hidden = true; document.body.classList.remove('timer-open'); return; }
  const sb = subj(a.subjectId);
  const paused = isPaused(a);
  const clock = fmtClock(activeNetMs(a, Date.now()));
  if (ui.timerOpen) {
    mini.hidden = true;
    ov.hidden = false;
    document.body.classList.add('timer-open');
    ov.className = paused ? 'is-paused' : '';
    ov.style.setProperty('--c', `var(--skill-${sb.skill})`);
    ov.innerHTML = `
      <div class="t-top"><button class="btn btn-ghost btn-small" data-action="minimize">⌄ ${t('timer.minimize')}</button>
        <button class="btn btn-ghost btn-small" data-action="timer-word">🔤 ${t('timer.addWord')}</button></div>
      <div class="t-center">
        <div class="t-emoji">${sb.emoji}</div>
        <div class="t-subj">${esc(sName(sb))}</div>
        <div class="t-state">${paused ? '⏸ ' + t('timer.paused') : '● ' + t('timer.running')}</div>
        <div class="t-clock" data-clock>${clock}</div>
      </div>
      <div class="t-btns">
        ${paused ? `<button class="t-btn t-resume" data-action="resume">▶ ${t('timer.resume')}</button>`
                 : `<button class="t-btn t-pause" data-action="pause">⏸ ${t('timer.pause')}</button>`}
        <button class="t-btn t-end" data-action="end">■ ${t('timer.end')}</button>
      </div>
      <button class="link-btn t-discard" data-action="discard">${t('timer.discard')}</button>`;
  } else {
    ov.hidden = true;
    document.body.classList.remove('timer-open');
    mini.hidden = false;
    mini.innerHTML = `<button class="mini-bar ${paused ? 'is-paused' : ''}" data-action="expand">
      <span>${sb.emoji} ${esc(sName(sb))}</span><b data-clock>${clock}</b><span>${paused ? '⏸' : '●'}</span></button>`;
  }
}

function renderPlayTimer(ov, mini, pa) {
  const c = catOf(pa.cat);
  const showClock = !S().playHideClock;
  const clock = fmtClock(Date.now() - pa.start);
  if (ui.timerOpen) {
    mini.hidden = true;
    ov.hidden = false;
    document.body.classList.add('timer-open');
    ov.className = 'is-play';
    ov.style.setProperty('--c', catVar(c));
    ov.innerHTML = `
      <div class="t-top"><button class="btn btn-ghost btn-small" data-action="minimize">⌄ ${t('timer.minimize')}</button><span></span></div>
      <div class="t-center">
        <div class="play-orb">${c.emoji}</div>
        <div class="t-subj">${esc(catName(c))}</div>
        <div class="t-state">● ${t('play.running')}</div>
        ${showClock ? `<div class="t-clock" data-clock>${clock}</div>`
          : `<div class="play-calm">${t('play.calm1')}<br>${t('play.calm2')}<br>${t('play.calm3')}</div>`}
      </div>
      <div class="t-btns"><button class="t-btn t-end" data-action="play-end">■ ${t('timer.end')}</button></div>
      <button class="link-btn t-discard" data-action="play-discard">${t('timer.discard')}</button>`;
  } else {
    ov.hidden = true;
    document.body.classList.remove('timer-open');
    mini.hidden = false;
    mini.innerHTML = `<button class="mini-bar is-play" data-action="expand">
      <span>${c.emoji} ${esc(catName(c))}</span>${showClock ? `<b data-clock>${clock}</b>` : ''}<span>●</span></button>`;
  }
}

function openPlayPick() {
  if (D().active) return toast(t('play.busyStudy'), 3000);
  openModal(`<div class="sheet-head"><h2>${t('play.pickTitle')}</h2><button class="icon-btn" data-action="modal-close" aria-label="${t('common.close')}">✕</button></div>
    <p class="muted">${t('play.pickHint')}</p>
    <div class="play-pick">${visCats().map((c) => `<button style="--c:${catVar(c)}" data-action="play-pick" data-id="${c.id}">
      <span class="pick-emoji">${c.emoji}</span><span class="lbl"><span class="sw" style="background:${catVar(c)}"></span>${esc(catName(c))}</span></button>`).join('')}</div>
    <div class="play-note"><span>ⓘ</span><span>${t('play.pickNote')}</span></div>`);
}

function startPlay(catId) {
  D().playActive = { cat: catId, start: Date.now() };
  save();
  closeModal();
  ui.timerOpen = true;
  render();
}

function endPlay() {
  const pa = D().playActive;
  if (!pa) return;
  const end = Date.now();
  const minutes = Math.round((end - pa.start) / 60000);
  D().playActive = null;
  ui.timerOpen = true;
  if (minutes < S().minSessionMinutes) { save(); closeModal(); render(); toast(t('play.tooShort')); return; }
  const rec = { id: uid(), cat: pa.cat, date: dayKey(pa.start), start: pa.start, end, minutes, guess: null, note: '' };
  D().plays.push(rec);
  save(); // 先保存，防止猜的过程中关掉 App 丢记录
  render();
  openGuess({ rec, kind: 'play' });
}

// ---------- 猜一猜 → 揭晓 ----------
const GUESS_CHIPS = [15, 30, 45, 60, 90, 120];
function openGuess(ctx) {
  ui.guess = { ...ctx, value: 30 };
  const isStudy = ctx.kind === 'study';
  const label = isStudy ? `${subj(ctx.rec.subjectId).emoji} ${esc(sName(subj(ctx.rec.subjectId)))}` : `${catOf(ctx.rec.cat).emoji} ${esc(catName(catOf(ctx.rec.cat)))}`;
  openModal(`<div class="guess-sheet">
    <div class="guess-cat">${label}</div>
    <h2>${t(isStudy ? 'guess.titleStudy' : 'guess.title')}</h2>
    <div class="muted">${t('guess.hint')}</div>
    <div class="guess-row">
      <button class="guess-step" data-action="g-step" data-d="-5" aria-label="-5">−5</button>
      <div class="guess-num"><b id="g-val">30</b><small>${t('guess.minUnit')}</small></div>
      <button class="guess-step" data-action="g-step" data-d="5" aria-label="+5">+5</button>
    </div>
    <div class="guess-chips">${GUESS_CHIPS.map((v) => `<button data-action="g-chip" data-v="${v}">${v}</button>`).join('')}</div>
    <button class="btn btn-play" data-action="g-reveal">${t('guess.reveal')}</button>
    <button class="link-btn guess-skip" data-action="g-skip">${t('guess.skip')}</button></div>`);
}
function setGuess(v) {
  ui.guess.value = Math.min(600, Math.max(1, v));
  const el = $('#g-val');
  if (el) el.textContent = ui.guess.value;
}

function openReveal(ctx, guess) {
  const rec = ctx.rec, actual = rec.minutes;
  if (guess != null) { rec.guess = guess; save(); }
  const isStudy = ctx.kind === 'study';
  const max = Math.max(guess || 0, actual, 30);
  const diff = guess == null ? 0 : actual - guess;
  const msg = guess == null ? '' : Math.abs(diff) <= 2 ? t('reveal.exact') : diff > 0 ? t('reveal.more', { n: diff }) : t('reveal.less', { n: -diff });
  const sum = senseSummary(isStudy ? D().sessions : D().plays, S().guessMinSessions, 5);
  let trend = '';
  if (guess != null && sum.ready) {
    const p = Math.round(Math.abs(sum.avg) * 100);
    const key = Math.abs(sum.avg) <= 0.03 ? 'reveal.trendEven' : sum.avg < 0 ? 'reveal.trendLess' : 'reveal.trendMore';
    trend = `<div class="rev-trend"><span>📈</span><span>${t(key, { n: sum.n, p })}</span></div>`;
  }
  const bars = `<div class="rev-bars">
    ${guess != null ? `<div><div class="rev-line"><span>${t('reveal.guess')}</span><b>${fmtMin(guess)}</b></div><div class="rev-bar guess" style="width:${(guess / max) * 100}%"></div></div>` : ''}
    <div><div class="rev-line"><span>${t('reveal.actual')}</span><b>${fmtMin(actual)}</b></div><div class="rev-bar actual" style="width:${(actual / max) * 100}%"></div></div></div>`;
  ui.guess = ctx;
  openModal(`<div class="sheet-head"><h2>${t('reveal.title')}</h2></div>${bars}
    ${msg ? `<div class="rev-msg">${msg}</div>` : ''}${trend}
    ${isStudy ? '' : `<label class="field" style="margin-top:14px">${t('reveal.notePh')}<input type="text" id="rev-note" class="rev-note" placeholder="${esc(t('reveal.noteEg'))}"></label>`}
    <div class="sheet-actions"><button class="btn btn-play" style="width:auto;padding:14px 32px" data-action="rev-done">${t(isStudy ? 'reveal.savedStudy' : 'reveal.done')}</button></div>`);
}

function startSession(subjectId) {
  if (D().playActive) return toast(t('play.busyPlay'), 3000);
  D().active = { subjectId, start: Date.now(), pauses: [] };
  save();
  closeModal();
  ui.timerOpen = true;
  render();
}

function endSession() {
  const a = D().active;
  if (!a) return;
  const now = Date.now();
  const last = a.pauses[a.pauses.length - 1];
  if (last && last.end == null) last.end = now;
  const minutes = Math.round(activeNetMs(a, now) / 60000);
  D().active = null;
  ui.timerOpen = true;
  if (minutes < S().minSessionMinutes) {
    save();
    closeModal();
    render();
    toast(t('sum.tooShort'));
    return;
  }
  const date = dayKey(a.start);
  const before = streak().totals[date]?.total || 0;
  const s = { id: uid(), subjectId: a.subjectId, date, start: a.start, end: now, minutes, pauses: a.pauses, note: '', stars: 0 };
  D().sessions.push(s);
  save(); // 先保存，防止填写过程中关掉 App 丢记录
  ui.pending = { sessionId: s.id, subjectId: s.subjectId, date, before, words: [] };
  render();
  if (S().studyGuess) openGuess({ rec: s, kind: 'study', next: () => openSummary(s, minutes) });
  else openSummary(s, minutes);
}

function openSummary(s, minutes) {
  const sb = subj(s.subjectId);
  openModal(`
    <div class="sheet-head"><h2>${sb.emoji} ${esc(sName(sb))}</h2></div>
    <p class="muted">${t('sum.title')}</p>
    <label class="field">${t('sum.duration')}<input type="number" id="sum-min" inputmode="numeric" min="1" max="600" value="${minutes}"></label>
    <label class="field">${t('sum.note')}<textarea id="sum-note" rows="3" placeholder="${esc(t('sum.notePh'))}"></textarea></label>
    <div class="field">${t('sum.stars')}${starsHTML(0)}</div>
    <div class="field">${t('sum.words')}${adderHTML('pending')}</div>
    <div class="sheet-actions"><button class="btn btn-ghost" data-action="sum-skip">${t('sum.skip')}</button>
      <button class="btn btn-primary" data-action="sum-save">${t('sum.save')}</button></div>`);
  loadDict().catch(() => {});
}

function finishSummary(withDetails) {
  const p = ui.pending;
  if (!p) { closeModal(); return; }
  const s = D().sessions.find((x) => x.id === p.sessionId);
  if (s && withDetails) {
    s.minutes = clampInt($('#sum-min')?.value, 1, 600, s.minutes);
    s.note = ($('#sum-note')?.value || '').trim();
    s.stars = +($('#modal .stars')?.dataset.v || 0);
  }
  for (const w of p.words) if (!wordExists(w.word)) D().words.push(w);
  save();
  ui.pending = null;
  closeModal();
  render();
  celebrate(p.date, p.before);
}

function celebrate(date, before) {
  const after = streak().totals[date]?.total || 0;
  const st = S();
  if (date !== today()) return toast(t('sum.saved'));
  if (before < st.goalMinutes && after >= st.goalMinutes) toast(t('celebrate.goal', { n: st.goalMinutes }), 3500);
  else if (before < st.checkinMinutes && after >= st.checkinMinutes) toast(t('celebrate.checkin'), 3500);
  else toast(t('sum.saved'));
}

function tick() {
  const a = D().active;
  const now = Date.now();
  if (!a && D().playActive) {
    const txt = fmtClock(now - D().playActive.start);
    document.querySelectorAll('[data-clock]').forEach((el) => (el.textContent = txt));
  }
  if (a) {
    const txt = fmtClock(activeNetMs(a, now));
    document.querySelectorAll('[data-clock]').forEach((el) => (el.textContent = txt));
    if (!modalOpen()) {
      if (isPaused(a) && pausedMs(a, now) > S().pauseRemindMinutes * 60000 && a.pauseReminded !== a.pauses.length) {
        a.pauseReminded = a.pauses.length; save();
        remind(t('remind.pause', { n: S().pauseRemindMinutes }), t('remind.keepPaused'));
      } else if (!isPaused(a) && activeNetMs(a, now) > S().longSessionMinutes * 60000 && !a.longReminded) {
        a.longReminded = true; save();
        remind(t('remind.long', { n: Math.round(S().longSessionMinutes / 60) }), t('remind.still'));
      }
    }
  }
  const k = today();
  if (ui.lastDay && ui.lastDay !== k && !modalOpen()) render();
  ui.lastDay = k;
}
function remind(msg, keepLabel) {
  openModal(`<p class="remind">${msg}</p>
    <div class="sheet-actions"><button class="btn btn-ghost" data-action="modal-close">${keepLabel}</button>
    <button class="btn btn-primary" data-action="end">${t('remind.endNow')}</button></div>`);
}

function openPicker() {
  const groups = SKILLS.map((sk) => {
    const items = D().subjects.filter((s) => s.skill === sk.id && !s.hidden);
    if (!items.length) return '';
    return `<div class="pick-group"><h3><span class="sw" style="background:var(--skill-${sk.id})"></span>${skillName(sk.id)}</h3>
      <div class="pick-grid">${items.map((s) => `<button class="pick" style="--c:var(--skill-${s.skill})" data-action="pick" data-id="${s.id}">
        <span class="pick-emoji">${s.emoji}</span><span>${esc(sName(s))}</span></button>`).join('')}</div></div>`;
  }).join('');
  openModal(`<div class="sheet-head"><h2>${t('pick.title')}</h2><button class="icon-btn" data-action="modal-close">✕</button></div>${groups}`, { cls: 'wide' });
}

// ============================================================
//  事件
// ============================================================
const ACTIONS = {
  tab: (el) => { ui.tab = el.dataset.tab; ui.dayOpen = null; closeModal(); window.scrollTo(0, 0); render(); },
  start: () => (D().playActive ? toast(t('play.busyPlay'), 3000) : openPicker()),
  pick: (el) => startSession(el.dataset.id),
  pause: () => { const a = D().active; if (a && !isPaused(a)) { a.pauses.push({ start: Date.now(), end: null }); save(); renderTimer(); } },
  resume: () => { const a = D().active; const p = a?.pauses[a.pauses.length - 1]; if (p && p.end == null) { p.end = Date.now(); save(); renderTimer(); } },
  end: () => { closeModal(); endSession(); },
  minimize: () => { ui.timerOpen = false; renderTimer(); },
  expand: () => { ui.timerOpen = true; renderTimer(); },
  discard: () => ask(t('timer.discardConfirm'), () => { closeModal(); D().active = null; save(); render(); }),
  kind: (el) => { ui[el.dataset.f] = el.dataset.k; render(); },
  'play-open': () => openPlayPick(),
  'play-expand': () => { ui.timerOpen = true; renderTimer(); },
  'play-pick': (el) => startPlay(el.dataset.id),
  'play-end': () => endPlay(),
  'play-discard': () => ask(t('timer.discardConfirm'), () => { closeModal(); D().playActive = null; save(); render(); }),
  'play-del': (el) => ask(t('play.deleteConfirm'), () => { D().plays = D().plays.filter((p) => p.id !== el.dataset.id); save(); render(); }),
  'g-step': (el) => setGuess(ui.guess.value + +el.dataset.d),
  'g-chip': (el) => setGuess(+el.dataset.v),
  'g-reveal': () => { const c = ui.guess; closeModal(); openReveal(c, c.value); },
  'g-skip': () => { const c = ui.guess; closeModal(); openReveal(c, null); },
  'rev-done': () => {
    const c = ui.guess;
    if (c.kind === 'play') { c.rec.note = ($('#rev-note')?.value || '').trim(); save(); closeModal(); ui.guess = null; render(); }
    else { closeModal(); ui.guess = null; c.next?.(); }
  },
  toggle: (el) => { S()[el.dataset.k] = !S()[el.dataset.k]; save(); render(); },
  'cat-edit': (el) => openCatForm(el.dataset.id),
  'cat-new': () => openCatForm(null),
  'cat-save': (el) => {
    const zh = $('#ct-zh').value.trim(), en = $('#ct-en').value.trim();
    if (!zh && !en) { toast(t('subj.needName')); return; }
    const fields = { name: { zh: zh || en, en: en || zh }, emoji: $('#ct-emoji').value.trim() || '🎲' };
    if (el.dataset.id) Object.assign(D().playCats.find((x) => x.id === el.dataset.id), fields, { hidden: $('#ct-hide')?.checked || false });
    else D().playCats.push({ id: 'c_' + uid(), ci: Math.max(-1, ...D().playCats.map((x) => x.ci ?? 0)) + 1, ...fields });
    save(); closeModal(); render();
  },
  'confirm-yes': () => { const c = ui.confirm; ui.confirm = null; closeModal(); c?.onYes?.(); },
  'confirm-no': () => { const c = ui.confirm; ui.confirm = null; closeModal(); c?.onNo?.(); },
  'timer-word': () => openWordAdd(),
  'sum-save': () => finishSummary(true),
  'sum-skip': () => finishSummary(false),
  star: (el) => {
    const box = el.closest('.stars');
    const v = +el.dataset.v === +box.dataset.v ? 0 : +el.dataset.v;
    box.dataset.v = v;
    box.querySelectorAll('.star').forEach((b) => b.classList.toggle('on', +b.dataset.v <= v));
  },
  makeup: (el) => {
    const res = streak();
    if (!makeupCandidates(res, S(), today()).includes(el.dataset.date)) return;
    D().makeups.push({ date: el.dataset.date, usedAt: Date.now() });
    save(); render(); toast(t('makeup.done'), 3000);
  },
  'modal-close': () => closeModal(),
  'modal-close-render': () => { closeModal(); render(); },

  // 单词输入组件
  'a-add': (el) => adderAdd(el),
  'a-speak': (el) => speak($('.a-word', el.closest('.adder')).value.trim()),
  'a-base': (el) => { const input = $('.a-word', el.closest('.adder')); input.value = el.dataset.w; onAdderInput(input); },
  'a-remove': (el) => { ui.pending.words.splice(+el.dataset.i, 1); renderPending(el.closest('.adder')); },
  speak: (el) => speak(el.dataset.w),

  // 统计
  range: (el) => { ui.range = +el.dataset.n; render(); },
  cal: (el) => {
    const [y, m] = ui.calMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + +el.dataset.d, 1);
    ui.calMonth = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    render();
  },

  // 历史
  day: (el) => { if (el.dataset.date <= today()) openDay(el.dataset.date); },
  'day-close': () => { ui.dayOpen = null; closeModal(); render(); },
  'sess-edit': (el) => { if (!modalOpen()) ui.dayOpen = null; openSessForm(el.dataset.id); },
  'sess-new': (el) => { if (!modalOpen()) ui.dayOpen = null; openSessForm(null, el.dataset.date); },
  'sess-cancel': () => (ui.dayOpen ? openDay(ui.dayOpen) : closeModal()),
  'sess-del': (el) => {
    if (!modalOpen()) ui.dayOpen = null;
    const id = el.dataset.id, day = ui.dayOpen;
    ask(t('sess.deleteConfirm'), () => {
      D().sessions = D().sessions.filter((s) => s.id !== id);
      save(); render(); if (day) openDay(day);
    }, () => { if (day) openDay(day); });
  },
  'sess-save': (el) => {
    const date = $('#f-date').value || today();
    const [y, mo, d] = date.split('-').map(Number);
    const [hh, mm] = ($('#f-time').value || '16:00').split(':').map(Number);
    const start = new Date(y, mo - 1, d, hh || 0, mm || 0).getTime();
    const minutes = clampInt($('#f-min').value, 1, 600, 30);
    const fields = {
      subjectId: $('#f-subj').value, date, start, end: start + minutes * 60000, minutes,
      note: $('#f-note').value.trim(), stars: +($('#modal .stars').dataset.v || 0),
    };
    if (el.dataset.id) Object.assign(D().sessions.find((s) => s.id === el.dataset.id), fields);
    else D().sessions.push({ id: uid(), pauses: [], ...fields });
    save();
    render();
    if (ui.dayOpen) openDay(date); else { closeModal(); toast(t('sum.saved')); }
  },

  // 单词本
  'w-filter': (el) => { ui.wordFilter = el.dataset.f; render(); },
  'w-new': () => openWordAdd(),
  'w-master': (el) => { const w = D().words.find((x) => x.id === el.dataset.id); w.mastered = !w.mastered; save(); render(); },
  'w-del': (el) => {
    const w = D().words.find((x) => x.id === el.dataset.id);
    ask(t('words.deleteConfirm', { w: w.word }), () => { D().words = D().words.filter((x) => x.id !== w.id); save(); render(); });
  },
  'w-edit': (el) => {
    const w = D().words.find((x) => x.id === el.dataset.id);
    openModal(`<div class="sheet-head"><h2>${esc(w.word)}</h2></div>
      <textarea id="we-mean" rows="5">${esc(w.meaning)}</textarea>
      <div class="sheet-actions"><button class="btn btn-ghost" data-action="modal-close">${t('common.cancel')}</button>
      <button class="btn btn-primary" data-action="w-edit-save" data-id="${w.id}">${t('common.save')}</button></div>`);
  },
  'w-edit-save': (el) => { D().words.find((x) => x.id === el.dataset.id).meaning = $('#we-mean').value.trim(); save(); closeModal(); render(); },
  'flash-start': () => openFlash(),
  flip: () => { ui.flash.flipped = !ui.flash.flipped; renderFlash(); },
  'flash-again': () => { ui.flash.i++; ui.flash.flipped = false; renderFlash(); },
  'flash-know': () => {
    const w = D().words.find((x) => x.id === ui.flash.deck[ui.flash.i]);
    if (w) { w.mastered = true; save(); }
    ui.flash.i++; ui.flash.flipped = false; renderFlash();
  },

  // 设置
  lang: (el) => { S().lang = el.dataset.l; save(); render(); },
  theme: (el) => { S().theme = el.dataset.m; save(); render(); },
  palette: (el) => { S().palette = el.dataset.p; save(); render(); },
  restday: (el) => {
    const d = +el.dataset.d, set = new Set(S().restDays);
    set.has(d) ? set.delete(d) : set.add(d);
    S().restDays = [...set].sort();
    save(); render();
  },
  'subj-edit': (el) => openSubjForm(el.dataset.id),
  'subj-new': () => openSubjForm(null),
  'subj-save': (el) => {
    const zh = $('#sj-zh').value.trim(), en = $('#sj-en').value.trim();
    if (!zh && !en) { toast(t('subj.needName')); return; }
    const fields = { name: { zh: zh || en, en: en || zh }, emoji: $('#sj-emoji').value.trim() || '📚', skill: $('#sj-skill').value };
    if (el.dataset.id) {
      const s = D().subjects.find((x) => x.id === el.dataset.id);
      Object.assign(s, fields, { hidden: $('#sj-hide')?.checked || false });
    } else D().subjects.push({ id: 'c_' + uid(), hidden: false, ...fields });
    save(); closeModal(); render();
  },
  export: () => doExport(),
  import: () => $('#imp').click(),
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) {
    document.querySelectorAll('.c-tip').forEach((tp) => (tp.hidden = true));
    return;
  }
  const fn = ACTIONS[el.dataset.action];
  if (fn) { e.preventDefault(); fn(el, e); }
});

let reflectTimer;
document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.matches('.a-word')) onAdderInput(el);
  else if (el.matches('.a-mean')) el.dataset.dirty = el.value ? '1' : '';
  else if (el.matches('[data-reflect]')) {
    clearTimeout(reflectTimer);
    reflectTimer = setTimeout(() => {
      const v = el.value.trim();
      if (v) D().reflections[el.dataset.reflect] = el.value; else delete D().reflections[el.dataset.reflect];
      save();
    }, 400);
  } else if (el.id === 'w-q') {
    ui.wordQuery = el.value;
    $('#word-list').innerHTML = wordListHTML();
  }
});

document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.matches('[data-setting]')) {
    S()[el.dataset.setting] = clampInt(el.value, 1, 600, S()[el.dataset.setting]);
    save();
    render();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.matches('.a-word')) { e.preventDefault(); adderAdd(e.target); }
});

$('#imp').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  const text = await f.text();
  ask(t('set.importConfirm'), () => {
    try {
      store.importJSON(text);
      toast(t('set.importOk'));
    } catch (_) {
      toast(t('set.importFail'));
    }
    render();
  });
});

// 回到前台时立即刷新（计时、跨天）
document.addEventListener('visibilitychange', () => { if (!document.hidden) { tick(); if (!modalOpen()) render(); } });

let resizeTimer;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => AFTER[ui.tab]?.(), 150); });

const VIEWS = { today: viewToday, stats: viewStats, words: viewWords, settings: viewSettings };
const AFTER = { today: drawTodayChart, stats: drawStatsChart };

// ---------- 启动 ----------
store.load();
store.requestPersist();
ui.lastDay = today();
render();
setInterval(tick, 1000);

// ---------- 自动检查更新 ----------
// 每次回到前台都问一下服务器有没有新版本；装好新版后，底部弹出“点此更新”（不打断计时，数据都存着）。
function showUpdateBar() {
  if ($('#update-bar')) return;
  const b = document.createElement('button');
  b.id = 'update-bar';
  b.textContent = t('update.ready');
  b.addEventListener('click', () => location.reload());
  document.body.appendChild(b);
}
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  const hadController = !!navigator.serviceWorker.controller; // 第一次安装不提示
  navigator.serviceWorker.register('sw.js').then((reg) => {
    const check = () => reg.update().catch(() => {});
    document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
    setInterval(check, 60 * 60 * 1000);
  }).catch((e) => console.warn('SW failed', e));
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController) showUpdateBar(); });
}

// 测试/调试用
window.__app = { store, render, ui };
