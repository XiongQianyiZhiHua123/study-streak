# Study Streak 学习打卡 — 设计规格 v1.2

给 12 岁孩子用的英语学习计时打卡工具。iPad 优先，同时适配 iPhone / Mac。

## 1. 平台与部署

- 网页应用（PWA），托管在 GitHub Pages（HTTPS）。
- iPad Safari 打开一次 → 分享 → 添加到主屏幕 → 桌面图标，全屏运行。
- 首次打开需联网，之后完全离线（Service Worker 缓存程序和字典）。
- **数据只存 iPad 本机**（localStorage），不上传。设置页提供导出/导入 JSON 备份。

## 2. 架构（为方便修改而分层）

| 文件 | 职责 | 什么时候改它 |
|---|---|---|
| `js/config.js` | 默认规则、学习项目、技能分组 | 改规则默认值、增删默认项目 |
| `js/i18n.js` | 中/英两套界面文字 | 改措辞 |
| `js/logic.js` | 纯计算：时长、打卡、连续天数、补签卡、统计 | 改打卡规则 |
| `js/store.js` | 存储接口（读/写/导出/导入/数据迁移） | 换存储方式（如以后加 iCloud） |
| `js/dict.js` | 离线字典查询、词形还原 | 换字典 |
| `js/chart.js` | 柱状图 | 改图表 |
| `js/app.js` | 页面与交互 | 改界面 |
| `css/app.css` | 样式、颜色 | 改外观 |
| `data/dict.json` | 约 3.3 万常用词（来自开源 ECDICT，MIT 许可） | — |

无框架、无构建步骤：改完文件直接上传即可。

## 3. 数据结构（schema 1）

```
settings    lang, checkinMinutes=30, goalMinutes=60, restDays=[0,6],
            cardEvery=5, cardMax=3, makeupWindow=3, minSessionMinutes=1,
            pauseRemindMinutes=30, longSessionMinutes=180, lastBackup
subjects[]  id, skill, emoji, name{en,zh}, hidden
sessions[]  id, subjectId, date(YYYY-MM-DD,按开始日), start, end, minutes,
            pauses[{start,end}], note, stars(0-5)
makeups[]   date(被补签的日子), usedAt
reflections {date: 每日总结文字}
words[]     id, word, phon, meaning, date, subjectId, sessionId, mastered, createdAt
active      进行中的计时 {subjectId, start, pauses[], reminded…}（关 App 不丢）
```
每日汇总、连续天数、补签卡数量都**不存储**，每次由 sessions + makeups 重新计算。

## 4. 规则

- **打卡成功**：当天累计 ≥ 30 分钟。**每日目标**：60 分钟。
- **休息日**（默认周六、周日，可在设置修改）：没学不中断连续天数；学满 30 分钟连续天数 +1，日历显示 ⭐。
- **当天未满 30 分钟**：到午夜前不判定中断。
- **补签卡**：连续打卡每满 5 天得 1 张，最多 3 张；只能补最近 3 天内漏掉的学习日；补签日计入连续天数，不增加时长，日历显示 🛡️。
- **计时**：只记开始时间戳和暂停区间，关 App / 锁屏不影响。跨午夜按开始日计。少于 1 分钟自动丢弃。
- **暂停**超过 30 分钟提醒是否结束；**连续计时**超过 3 小时提醒是否忘了结束。

## 5. 学习项目（按技能分组，可在设置里增删改）

| 技能 | 项目 |
|---|---|
| 🎧 听 Listening | 跟看纪录片、听写句子、听播客/有声书 |
| 🗣️ 说 Speaking | 和 AI 英语聊天、影子跟读 |
| 📖 读 Reading | 阅读文章 |
| ✍️ 写 Writing | 书本习题、英语日记/写作 |
| 🔤 词汇 Vocabulary | 查找学习生词、复习单词卡 |
| ⭐ 其他 Other | 其他 |

## 6. 页面（4 个页签）

1. **今天**：连续天数 🔥、补签卡 🛡️、今日时长进度条（30 打卡线 / 60 目标线）、补签提示、开始按钮、**最近 7 天柱状图**、今日记录（可修改/删除/补录）、今日总结。
2. **计时**（全屏，可缩小为底部小条）：项目、计时、暂停/继续、结束、放弃。
3. **结束记录**：时长（可改）、学了什么、新单词（自动查字典填释义）、自评星级。
4. **统计**：7 / 30 天堆叠柱状图（按技能分色，30/60 虚线）、汇总数字、月历打卡图、技能占比。
5. **某天详情**（点柱状图或日历打开，取代原“历史”页）：当日总结、记录的修改/删除/补录。
6. **单词本**：搜索、筛选（学习中/已掌握）、朗读 🔊、闪卡复习。
7. **设置**：语言、外观（跟随系统/浅色/深色 + 5 套配色方案：晴空蓝、森林绿、日落橙、薰衣草、薄荷青，在 config.js 的 PALETTES 里增改）、打卡与目标分钟、休息日、学习项目管理、备份导出/导入。

## 7. 屏幕适配

- iPad 竖放 / iPhone：单栏，底部导航。
- iPad 横放（宽 ≥ 1000 且横向）：左侧竖排导航，今天和统计页分两栏；打开即可看到柱状图。

## 8. 测试

- `tests/logic.test.mjs`：打卡、休息日、补签卡等规则的单元测试。
- `tests/e2e.py`：浏览器自动化测试，在 iPad 竖屏、iPad 横屏、iPhone、深色模式下各模拟一遍完整操作（共 196 项检查）。
