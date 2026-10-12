// 运行：node tests/logic.test.mjs
import assert from 'node:assert/strict';
import { computeStreak, makeupCandidates, addDays, weekday, daysToNextCard } from '../js/logic.js';
import { DEFAULT_SETTINGS, DEFAULT_SUBJECTS } from '../js/config.js';

const settings = { ...DEFAULT_SETTINGS };
const subjects = DEFAULT_SUBJECTS;
const sess = (date, minutes, subjectId = 'reading') => ({ date, minutes, subjectId });
const run = (sessions, today, makeups = []) => computeStreak({ sessions, subjects, makeups, settings, today });

// 2026-09-28 是周一
assert.equal(weekday('2026-09-28'), 1);
assert.equal(weekday('2026-10-03'), 6);

let ok = 0;
const test = (name, fn) => { fn(); ok++; console.log('✓', name); };

test('empty', () => { const r = run([], '2026-10-01'); assert.equal(r.current, 0); });

test('weekday streak, under 30 does not count', () => {
  const r = run([sess('2026-09-28', 30), sess('2026-09-29', 45), sess('2026-09-30', 29)], '2026-09-30');
  assert.equal(r.current, 2);                      // 今天未满 30：pending，不中断
  assert.equal(r.days['2026-09-30'].status, 'pending');
});

test('missed weekday breaks streak', () => {
  const r = run([sess('2026-09-28', 30), sess('2026-09-30', 30)], '2026-09-30');
  assert.equal(r.days['2026-09-29'].status, 'missed');
  assert.equal(r.current, 1);
  assert.equal(r.best, 1);
});

test('weekend skip keeps streak, weekend study adds bonus', () => {
  const s = ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02'].map((d) => sess(d, 40));
  let r = run(s, '2026-10-05'); // 周六日没学，周一今天还没学
  assert.equal(r.days['2026-10-03'].status, 'rest');
  assert.equal(r.days['2026-10-04'].status, 'rest');
  assert.equal(r.current, 5);
  r = run([...s, sess('2026-10-03', 30)], '2026-10-04');
  assert.equal(r.days['2026-10-03'].status, 'bonus');
  assert.equal(r.current, 6);
});

test('multiple sessions sum per day', () => {
  const r = run([sess('2026-09-28', 15), sess('2026-09-28', 15, 'aichat')], '2026-09-28');
  assert.equal(r.days['2026-09-28'].status, 'done');
  assert.deepEqual(r.totals['2026-09-28'].bySkill, { read: 15, speak: 15 });
});

test('cards: earn every 5, cap 3, makeup restores streak and spends card', () => {
  // 连续 5 个学习日 → 1 张卡
  const wk1 = ['2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11'].map((d) => sess(d, 30));
  let r = run(wk1, '2026-09-11');
  assert.equal(r.cards, 1);
  assert.equal(daysToNextCard(r, settings), 5);
  // 周一漏掉，周二打卡
  const s = [...wk1, sess('2026-09-15', 30)];
  r = run(s, '2026-09-15');
  assert.equal(r.current, 1);
  assert.deepEqual(makeupCandidates(r, settings, '2026-09-15'), ['2026-09-14']);
  r = run(s, '2026-09-15', [{ date: '2026-09-14' }]);
  assert.equal(r.days['2026-09-14'].status, 'makeup');
  assert.equal(r.current, 7);
  assert.equal(r.cards, 0);
  // 封顶
  const many = [];
  for (let d = '2026-06-01'; d <= '2026-08-31'; d = addDays(d, 1)) if (![0, 6].includes(weekday(d))) many.push(sess(d, 30));
  r = run(many, '2026-08-31');
  assert.equal(r.cards, 3);
  assert.equal(daysToNextCard(r, settings), 0);
});

test('makeup window: only last 3 days, only with cards', () => {
  const wk1 = ['2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11'].map((d) => sess(d, 30));
  const r = run(wk1, '2026-09-18'); // 周一到周四都没学，今天周五
  assert.deepEqual(makeupCandidates(r, settings, '2026-09-18'), ['2026-09-17', '2026-09-16', '2026-09-15']);
  const r0 = run([sess('2026-09-07', 30)], '2026-09-09');
  assert.deepEqual(makeupCandidates(r0, settings, '2026-09-09'), []); // 没卡
});

console.log(`\n${ok} tests passed`);

// ---------- 玩（时间感练习）----------
import { playTotalsByDay, guessBias, guessed, senseSummary } from '../js/logic.js';
const play = (date, cat, minutes, guess = null, start = 0) => ({ date, cat, minutes, guess, start });

test('play totals by day and category', () => {
  const r = playTotalsByDay([play('2026-10-01', 'pc', 40), play('2026-10-01', 'ipad', 20), play('2026-10-02', 'pc', 30)]);
  assert.equal(r['2026-10-01'].total, 60);
  assert.equal(r['2026-10-01'].byCat.pc, 40);
  assert.equal(r['2026-10-01'].count, 2);
  assert.equal(r['2026-10-02'].total, 30);
});

test('play records never affect the study streak', () => {
  // computeStreak 只看 sessions，玩的记录在 plays 里，根本传不进去
  const r = run([sess('2026-09-28', 30)], '2026-09-28');
  assert.equal(r.current, 1);
});

test('guess bias: negative means underestimated', () => {
  assert.equal(guessBias(40, 50), -0.2);
  assert.equal(guessBias(60, 50), 0.2);
  assert.equal(guessBias(10, 0), 0);
});

test('senseSummary needs enough guesses before it is ready', () => {
  const recs = [play('a', 'pc', 50, 40, 1), play('a', 'pc', 100, 80, 2), play('a', 'pc', 10, null, 3), play('a', 'pc', 20, 10, 4)];
  assert.equal(guessed(recs).length, 3);                    // 没猜的不算
  const s3 = senseSummary(recs, 5);
  assert.equal(s3.n, 3);
  assert.equal(s3.ready, false);
  const more = [...recs, play('a', 'pc', 50, 50, 5), play('a', 'pc', 30, 30, 6)];
  const s5 = senseSummary(more, 5);
  assert.equal(s5.n, 5);
  assert.equal(s5.ready, true);
  assert.ok(s5.avg < 0 && s5.avg > -0.5);                   // 平均少估
});

test('senseSummary takes only the most recent N', () => {
  const recs = [];
  for (let i = 1; i <= 10; i++) recs.push(play('a', 'pc', 100, i <= 5 ? 50 : 100, i)); // 早 5 次少估，近 5 次全对
  assert.equal(senseSummary(recs, 5, 5).avg, 0);
});
