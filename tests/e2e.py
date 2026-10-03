"""
浏览器自动化测试：模拟孩子的真实操作，在 iPad 竖屏 / iPad 横屏 / iPhone / 深色模式下各跑一遍。
运行：
  python3 -m http.server 8765        # 在项目根目录
  python3 tests/e2e.py [http://localhost:8765/] [截图目录]
需要：pip install playwright
"""
import sys, json, datetime, os
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/'
SHOTS = sys.argv[2] if len(sys.argv) > 2 else None
VIEWPORTS = [
    ('ipad-portrait', 820, 1180, 'light'),
    ('ipad-landscape', 1180, 820, 'light'),
    ('iphone', 390, 844, 'light'),
    ('ipad-landscape-dark', 1180, 820, 'dark'),
]

results = []
def check(name, cond, detail=''):
    results.append((name, bool(cond), detail))
    print(('  ✓ ' if cond else '  ✗ ') + name + (f'  [{detail}]' if detail and not cond else ''))


def seed():
    """过去 3 周每个学习日都打卡，最近 3 天内漏掉一个学习日（用于测试补签卡）。"""
    today = datetime.date.today()
    missed = next(today - datetime.timedelta(days=i) for i in range(1, 4) if (today - datetime.timedelta(days=i)).weekday() < 5)
    sessions = []
    for i in range(22, 0, -1):
        d = today - datetime.timedelta(days=i)
        if d.weekday() >= 5 or d == missed:
            continue
        st = int(datetime.datetime.combine(d, datetime.time(16, 0)).timestamp() * 1000)
        sessions.append(dict(id=f's{i}', subjectId=['reading', 'aichat', 'dictation'][i % 3], date=d.isoformat(),
                             start=st, end=st + 40 * 60000, minutes=40, pauses=[], note='test note', stars=3))
    words = [dict(id='w1', word='curious', phon="'kjʊәriәs", meaning='a. 好奇的', date=today.isoformat(), subjectId='reading',
                  sessionId=None, mastered=False, createdAt=1)]
    return dict(schema=1, settings=dict(lang='zh'), sessions=sessions, makeups=[], reflections={}, words=words, active=None,
                createdAt=0), missed.isoformat()


def no_overflow(pg):
    return pg.evaluate('document.scrollingElement.scrollWidth <= window.innerWidth + 1')


def run(p, name, w, h, scheme):
    print(f'\n== {name} ({w}x{h}, {scheme}) ==')
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': w, 'height': h}, color_scheme=scheme, has_touch=True)
    pg = ctx.new_page()
    errors = []
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    data, missed = seed()
    pg.goto(BASE)
    pg.evaluate("d => { localStorage.clear(); localStorage.setItem('studyStreak.data', JSON.stringify(d)); }", data)
    pg.reload(); pg.wait_for_timeout(400)
    st = lambda: pg.evaluate('__app.store.data')
    shot = lambda n: SHOTS and pg.screenshot(path=os.path.join(SHOTS, f'{name}_{n}.png'), full_page=False)

    # --- 首页 ---
    check('首页有 7 天柱状图', pg.locator('#chart svg').count() == 1)
    check('底部/侧边导航只有 4 个页签', pg.locator('#tabs .tab').count() == 4)
    check('无横向滚动（今天）', no_overflow(pg))
    check('补签提示出现', pg.locator('[data-action=makeup]').count() == 1)
    shot('today')

    # --- 补签卡 ---
    streak_before = int(pg.inner_text('.tile-fire .tile-num'))
    pg.click('[data-action=makeup]'); pg.wait_for_timeout(200)
    streak_after = int(pg.inner_text('.tile-fire .tile-num'))
    check('使用补签卡后连续天数增加', streak_after > streak_before, f'{streak_before}->{streak_after}')
    check('补签记录已保存', any(m['date'] == missed for m in st()['makeups']))

    # --- 计时：开始、暂停、继续、刷新不丢、结束 ---
    pg.click('[data-action=start]'); pg.click('[data-action=pick][data-id=documentary]')
    check('计时界面打开', pg.is_visible('#timer'))
    pg.evaluate('() => { const a = __app.store.data.active; a.start -= 31 * 60000; __app.store.save(); }')
    pg.click('[data-action=pause]'); pg.wait_for_timeout(1100)
    c1 = pg.inner_text('#timer .t-clock'); pg.wait_for_timeout(1100); c2 = pg.inner_text('#timer .t-clock')
    check('暂停时计时停止', c1 == c2, f'{c1} vs {c2}')
    shot('timer')
    pg.reload(); pg.wait_for_timeout(400)
    check('刷新/关闭 App 后计时还在', st()['active'] is not None and pg.is_visible('#timer'))
    pg.click('[data-action=resume]')
    pg.click('[data-action=minimize]')
    check('缩小后显示底部小条', pg.is_visible('#mini .mini-bar'))
    pg.click('#mini .mini-bar')
    pg.click('[data-action=end]'); pg.wait_for_timeout(200)
    check('结束后弹出记录页', pg.locator('#sum-min').count() == 1)
    check('时长约 31 分钟', pg.input_value('#sum-min') in ('31', '32'), pg.input_value('#sum-min'))
    pg.fill('#sum-note', 'Ocean ep.4'); pg.click('#modal .stars [data-v="4"]')
    pg.fill('.a-word', 'went'); pg.wait_for_timeout(1500)
    check('字典自动识别原形 go', 'go' in pg.inner_text('.a-info'))
    check('释义自动填写', len(pg.input_value('.a-mean')) > 3)
    pg.click('[data-action=a-add]')
    pg.fill('.a-word', 'curious'); pg.wait_for_timeout(600); pg.click('[data-action=a-add]')
    check('重复单词不会重复加入', len([x for x in st()['words'] if x['word'] == 'curious']) == 1)
    shot('summary')
    pg.click('[data-action=sum-save]'); pg.wait_for_timeout(300)
    s = st()
    last = s['sessions'][-1]
    check('记录已保存（内容、星级、时长）', last['note'] == 'Ocean ep.4' and last['stars'] == 4 and last['minutes'] >= 31)
    check('新单词进入单词本', any(x['word'] == 'went' for x in s['words']))

    # --- 太短的记录不保存 ---
    n = len(st()['sessions'])
    pg.click('[data-action=start]'); pg.click('[data-action=pick][data-id=reading]'); pg.click('[data-action=end]'); pg.wait_for_timeout(200)
    check('不到 1 分钟不保存', len(st()['sessions']) == n)

    # --- 放弃计时（页面内确认框） ---
    pg.click('[data-action=start]'); pg.click('[data-action=pick][data-id=reading]')
    pg.click('[data-action=discard]'); pg.click('[data-action=confirm-yes]')
    check('放弃计时', st()['active'] is None and not pg.is_visible('#timer'))

    # --- 暂停提醒 ---
    pg.click('[data-action=start]'); pg.click('[data-action=pick][data-id=reading]'); pg.click('[data-action=pause]')
    pg.evaluate('() => { const a = __app.store.data.active; a.pauses[0].start -= 31 * 60000; a.start -= 40 * 60000; __app.store.save(); }')
    pg.wait_for_timeout(1300)
    check('暂停超过 30 分钟弹出提醒', pg.locator('#modal .remind').count() == 1)
    pg.click('#modal [data-action=end]'); pg.wait_for_timeout(200)
    pg.click('[data-action=sum-skip]'); pg.wait_for_timeout(200)

    # --- 今天页面：修改、补录、删除 ---
    pg.click('#view [data-action=sess-edit] >> nth=0'); pg.fill('#f-min', '25'); pg.click('[data-action=sess-save]'); pg.wait_for_timeout(200)
    check('在今天页面修改记录', any(x['minutes'] == 25 for x in st()['sessions']))
    n = len(st()['sessions'])
    pg.click('#view [data-action=sess-new]'); pg.fill('#f-min', '15'); pg.click('[data-action=sess-save]'); pg.wait_for_timeout(200)
    check('补录一条记录', len(st()['sessions']) == n + 1)
    pg.click('#view [data-action=sess-del] >> nth=-1'); pg.click('[data-action=confirm-yes]'); pg.wait_for_timeout(200)
    check('删除记录（确认框）', len(st()['sessions']) == n)
    pg.fill('#view [data-reflect]', '今天学了很多'); pg.wait_for_timeout(600)
    check('今日总结自动保存', any('今天学了很多' in v for v in st()['reflections'].values()))
    check('无横向滚动（今天，有数据）', no_overflow(pg))

    # --- 图表点一下 → 查看这天 ---
    pg.locator('#chart .c-hit').nth(5).click(); pg.wait_for_timeout(150)
    check('点柱子显示提示', pg.is_visible('#chart .c-tip'))
    pg.click('#chart .tip-btn'); pg.wait_for_timeout(150)
    check('从柱状图打开某天详情', pg.locator('#modal [data-action=day-close]').count() == 1)
    pg.click('[data-action=day-close]')

    # --- 统计页 ---
    pg.click('[data-tab=stats]'); pg.wait_for_timeout(200)
    check('统计页 7 天图表', pg.locator('#chart svg').count() == 1)
    pg.click('[data-action=range][data-n="30"]'); pg.wait_for_timeout(200)
    check('切换 30 天', pg.locator('#chart .c-hit').count() == 30)
    check('日历有补签标记', pg.locator('.cal-cell.makeup').count() >= 1)
    check('无横向滚动（统计）', no_overflow(pg))
    shot('stats')
    pg.click('.cal-cell.done >> nth=0'); pg.wait_for_timeout(150)
    check('日历点日期打开详情', pg.locator('#modal [data-action=day-close]').count() == 1)
    pg.click('[data-action=day-close]')
    pg.click('[data-action=cal][data-d="-1"]'); pg.click('[data-action=cal][data-d="1"]')

    # --- 单词本 ---
    pg.click('[data-tab=words]'); pg.wait_for_timeout(200)
    total = pg.locator('.word').count()
    pg.fill('#w-q', 'went'); pg.wait_for_timeout(100)
    check('搜索单词', pg.locator('.word').count() == 1)
    pg.fill('#w-q', '')
    pg.click('[data-action=w-master] >> nth=0')
    pg.click('[data-action=w-filter][data-f=mastered]')
    check('筛选已掌握', pg.locator('.word').count() == 1)
    pg.click('[data-action=w-filter][data-f=all]')
    pg.click('[data-action=flash-start]'); pg.click('[data-action=flip]')
    check('闪卡翻面显示释义', pg.locator('.flash-mean').count() == 1)
    pg.click('[data-action=flash-know]'); pg.click('#modal [data-action=modal-close-render] >> nth=0')
    pg.click('[data-action=w-new]'); pg.fill('.a-word', 'explore'); pg.wait_for_timeout(700); pg.click('[data-action=a-add]')
    pg.click('#modal [data-action=modal-close-render]')
    check('单词本里直接添加', pg.locator('.word').count() == total + 1)
    pg.click('[data-action=w-del] >> nth=0'); pg.click('[data-action=confirm-yes]')
    check('删除单词', pg.locator('.word').count() == total)
    check('无横向滚动（单词本）', no_overflow(pg))
    shot('words')

    # --- 设置 ---
    pg.click('[data-tab=settings]'); pg.wait_for_timeout(200)
    pg.click('[data-action=theme][data-m=dark]')
    check('切换深色', pg.evaluate("document.documentElement.getAttribute('data-app-theme')") == 'dark')
    pg.click('[data-action=palette][data-p=lavender]')
    acc = pg.evaluate("getComputedStyle(document.body).backgroundColor")
    check('切换配色方案（深色薰衣草底色）', acc == 'rgb(19, 18, 25)', acc)
    check('设置里有 5 套色卡', pg.locator('.pal').count() == 5)
    shot('settings_dark')
    pg.click('[data-action=theme][data-m=auto]'); pg.click('[data-action=palette][data-p=sky]')
    pg.click('[data-action=lang][data-l=en]')
    check('切换英文', 'Settings' in pg.inner_text('#view h1'))
    pg.click('[data-action=lang][data-l=zh]')
    pg.fill('[data-setting=checkinMinutes]', '20'); pg.press('[data-setting=checkinMinutes]', 'Tab'); pg.wait_for_timeout(100)
    check('修改打卡分钟数', st()['settings']['checkinMinutes'] == 20)
    pg.click('[data-action=restday][data-d="3"]')
    check('修改休息日', 3 in st()['settings']['restDays'])
    pg.click('[data-action=restday][data-d="3"]')
    pg.click('[data-action=subj-new]'); pg.fill('#sj-zh', '背课文'); pg.fill('#sj-en', 'Recite'); pg.click('[data-action=subj-save]')
    check('添加学习项目', any(x['name']['zh'] == '背课文' for x in st()['subjects']))
    pg.click('.subj-row >> text=背课文'); pg.check('#sj-hide'); pg.click('[data-action=subj-save]')
    pg.click('[data-tab=today]'); pg.click('[data-action=start]')
    check('隐藏的项目不出现在选择列表', pg.locator('.pick >> text=背课文').count() == 0)
    pg.click('#modal [data-action=modal-close]')

    # --- 导入备份 ---
    backup = pg.evaluate('__app.store.exportJSON()')
    pg.click('[data-tab=settings]')
    pg.set_input_files('#imp', files=[{'name': 'b.json', 'mimeType': 'application/json', 'buffer': backup.encode()}])
    pg.wait_for_timeout(200); pg.click('[data-action=confirm-yes]'); pg.wait_for_timeout(200)
    check('导入备份', len(st()['sessions']) > 0)
    pg.set_input_files('#imp', files=[{'name': 'bad.json', 'mimeType': 'application/json', 'buffer': b'{"x":1}'}])
    pg.wait_for_timeout(200); pg.click('[data-action=confirm-yes]'); pg.wait_for_timeout(200)
    check('错误的备份文件不会破坏数据', len(st()['sessions']) > 0)

    check('没有任何脚本错误', not errors, '; '.join(errors[:3]))
    b.close()


with sync_playwright() as p:
    for vp in VIEWPORTS:
        run(p, *vp)

failed = [r for r in results if not r[1]]
print(f'\n{len(results) - len(failed)} / {len(results)} 项通过')
sys.exit(1 if failed else 0)
