// ============================================================
//  chart.js — 每日学习时长堆叠柱状图（纯 SVG，无第三方库）
//  颜色来自 CSS 变量 --skill-<id>，文字用文字色，不用系列色。
// ============================================================

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** 顶部圆角（4px）、底部贴基线的矩形路径 */
function topRounded(x, y, w, h, r) {
  r = Math.min(r, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

/**
 * @param el      容器元素
 * @param opts    { days:[{key,label,total,bySkill,rest,tip}], skills:[{id,name}], checkin, goal, labels:{checkin,goal}, fmt }
 */
export function drawBarChart(el, opts) {
  const { days, skills, checkin, goal, labels, fmt } = opts;
  const col = opts.color || ((id) => `var(--skill-${id})`);
  const W = Math.max(280, el.clientWidth || 600);
  const H = opts.height || 260;
  const m = { l: 34, r: 12, t: 16, b: 34 };
  const pw = W - m.l - m.r, ph = H - m.t - m.b;

  const maxV = Math.max((goal || 0) * 1.15, ...days.map((d) => d.total * 1.08), 30);
  const step = maxV > 240 ? 60 : 30;
  const yMax = Math.ceil(maxV / step) * step;
  const y = (v) => m.t + ph - (v / yMax) * ph;

  const n = days.length;
  const slot = pw / n;
  const bw = Math.max(4, Math.min(36, slot * 0.62));
  const labelEvery = n <= 10 ? 1 : n <= 20 ? 2 : 5;

  let g = '';
  // 休息日背景
  days.forEach((d, i) => {
    if (d.rest) g += `<rect class="c-rest" x="${m.l + i * slot}" y="${m.t}" width="${slot}" height="${ph}"/>`;
  });
  // 网格与 Y 轴刻度
  for (let v = 0; v <= yMax; v += step) {
    g += `<line class="c-grid" x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}"/>`;
    g += `<text class="c-axis" x="${m.l - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
  }
  // 柱子
  days.forEach((d, i) => {
    const x = m.l + i * slot + (slot - bw) / 2;
    const segs = skills.map((s) => ({ id: s.id, v: d.bySkill[s.id] || 0 })).filter((s) => s.v > 0);
    let acc = 0;
    segs.forEach((s, j) => {
      const y0 = y(acc), y1 = y(acc + s.v);
      acc += s.v;
      const isTop = j === segs.length - 1;
      const h = Math.max(0, y0 - y1 - (j > 0 ? 2 : 0)); // 段间 2px 间隙
      if (h <= 0) return;
      g += isTop
        ? `<path class="c-bar" style="fill:${col(s.id)}" d="${topRounded(x, y1, bw, h, 4)}"/>`
        : `<rect class="c-bar" style="fill:${col(s.id)}" x="${x}" y="${y1}" width="${bw}" height="${h}"/>`;
    });
    if (i % labelEvery === 0 || i === n - 1) {
      g += `<text class="c-axis${d.isToday ? ' c-today' : ''}" x="${m.l + i * slot + slot / 2}" y="${H - m.b + 16}" text-anchor="middle">${esc(d.label)}</text>`;
      if (n <= 10 && d.sub) g += `<text class="c-axis c-sub" x="${m.l + i * slot + slot / 2}" y="${H - m.b + 29}" text-anchor="middle">${esc(d.sub)}</text>`;
    }
  });
  // 打卡线 / 目标线
  const ref = (v, cls, text) =>
    `<line class="${cls}" x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}"/>` +
    `<text class="c-ref-label" x="${W - m.r - 2}" y="${y(v) - 5}" text-anchor="end">${esc(text)} ${v}</text>`;
  if (!opts.hideRefs) {
    g += ref(checkin, 'c-line-checkin', labels.checkin);
    g += ref(goal, 'c-line-goal', labels.goal);
  }
  if (opts.avg) {
    g += `<line class="c-line-avg" x1="${m.l}" x2="${W - m.r}" y1="${y(opts.avg.value)}" y2="${y(opts.avg.value)}"/>` +
         `<text class="c-avg-label" x="${m.l + 2}" y="${y(opts.avg.value) - 5}">${esc(opts.avg.label)}</text>`;
  }
  // 基线
  g += `<line class="c-base" x1="${m.l}" x2="${W - m.r}" y1="${y(0)}" y2="${y(0)}"/>`;
  // 点击/悬停热区（比柱子大）
  days.forEach((d, i) => {
    g += `<rect class="c-hit" data-i="${i}" x="${m.l + i * slot}" y="${m.t}" width="${slot}" height="${ph}"/>`;
  });

  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">${g}</svg><div class="c-tip" hidden></div>`;

  // tooltip
  const tip = el.querySelector('.c-tip');
  const show = (i) => {
    const d = days[i];
    const rows = skills.filter((s) => d.bySkill[s.id]).map((s) =>
      `<div class="tip-row"><span class="sw" style="background:${col(s.id)}"></span>${esc(s.name)}<b>${fmt(d.bySkill[s.id])}</b></div>`).join('');
    tip.innerHTML = `<div class="tip-head">${esc(d.tip)}</div><div class="tip-total">${fmt(d.total)}</div>${rows}
      ${opts.noView ? '' : `<button type="button" class="tip-btn" data-action="day" data-date="${d.key}">${esc(labels.view)} ›</button>`}`;
    tip.hidden = false;
    // 放在柱子旁边而不是上方，避免挡住被点的柱子
    const x0 = m.l + i * slot, x1 = x0 + slot;
    const tw = tip.offsetWidth;
    const left = x1 + 6 + tw <= W ? x1 + 6 : Math.max(0, x0 - 6 - tw);
    tip.style.left = left + 'px';
    tip.style.top = m.t + 'px';
    el.querySelectorAll('.c-hit').forEach((r) => r.classList.toggle('on', +r.dataset.i === i));
  };
  const hide = () => { tip.hidden = true; el.querySelectorAll('.c-hit.on').forEach((r) => r.classList.remove('on')); };
  el.querySelectorAll('.c-hit').forEach((r) => {
    r.addEventListener('pointerenter', () => show(+r.dataset.i));
    r.addEventListener('click', (e) => { e.stopPropagation(); show(+r.dataset.i); });
  });
  el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') hide(); });
}
