// ============================================================
//  i18n.js — 界面文字。中文模式只显示中文，英文模式只显示英文。
//  改措辞只改这里。{n} 之类是占位符。
// ============================================================

const zh = {
  appName: '学习打卡',
  'tab.today': '今天', 'tab.stats': '统计', 'tab.words': '单词本', 'tab.settings': '设置',

  'today.title': '今天',
  'streak.days': '连续打卡天数', 'streak.best': '最长 {n} 天',
  'cards.label': '补签卡', 'cards.next': '再打卡 {n} 天得 1 张', 'cards.full': '已存满',
  'today.minutes': '今日学习',
  'today.goalDone': '🎉 今日目标完成！', 'today.checked': '✅ 已打卡，离目标还差 {n}',
  'today.toCheckin': '还差 {n} 打卡', 'today.restDay': '休息日 · 学满 {n} 分钟可得 ⭐',
  'today.restChecked': '⭐ 休息日也打卡了，真棒！',
  'today.lineCheckin': '打卡', 'today.lineGoal': '目标',
  'today.week': '最近 7 天', 'today.moreStats': '更多统计', 'chart.viewDay': '查看这天',
  'set.theme': '外观', 'set.palette': '配色方案', 'mode.auto': '跟随系统', 'mode.light': '浅色', 'mode.dark': '深色',
  'palette.sky': '晴空蓝', 'palette.forest': '森林绿', 'palette.sunset': '日落橙', 'palette.lavender': '薰衣草', 'palette.mint': '薄荷青',
  'today.start': '开始学习', 'today.resume': '回到计时',
  'today.sessions': '今天的学习记录', 'today.noSessions': '还没有记录，点上面的按钮开始吧。',
  'today.reflection': '今日总结', 'today.reflectionPh': '今天最大的收获是什么？有什么难点？',
  'makeup.banner': '{date} 没有打卡。要用 1 张补签卡吗？（剩 {n} 张）', 'makeup.use': '使用补签卡', 'makeup.done': '🛡️ 补签成功！',
  'backup.remind': '已经超过 30 天没有备份了，建议去“设置”导出一份。',

  'pick.title': '这次学什么？',
  'skill.listen': '听', 'skill.speak': '说', 'skill.read': '读', 'skill.write': '写', 'skill.vocab': '词汇', 'skill.other': '其他',

  'timer.paused': '已暂停', 'timer.running': '专注中', 'timer.pause': '暂停', 'timer.resume': '继续', 'timer.end': '结束',
  'timer.minimize': '缩小', 'timer.discard': '放弃本次', 'timer.discardConfirm': '确定放弃这次计时吗？不会保存记录。',
  'timer.addWord': '记单词',
  'remind.pause': '已经暂停超过 {n} 分钟了。要结束这次学习吗？', 'remind.long': '已经连续计时超过 {n} 小时。是不是忘了点结束？',
  'remind.endNow': '结束并记录', 'remind.keepPaused': '继续暂停', 'remind.still': '还在学习',

  'sum.title': '这次学得怎么样？', 'sum.duration': '学习时长（分钟）', 'sum.note': '学了什么', 'sum.notePh': '例如：看了纪录片第 3 集，学会了 5 个关于海洋的词',
  'sum.stars': '自我评价', 'sum.words': '新单词', 'sum.save': '保存', 'sum.skip': '跳过，只保存时长',
  'sum.tooShort': '不到 1 分钟，没有保存。', 'sum.saved': '已保存 👍',
  'celebrate.checkin': '🔥 今日打卡成功！', 'celebrate.goal': '🎉 完成今日 {n} 分钟目标！',

  'words.inputPh': '输入英文单词', 'words.meaningPh': '释义（自动填写，可修改）', 'words.add': '加入单词本',
  'words.notFound': '字典里没找到，可以自己填写释义。', 'words.baseHint': '原形是 {w}', 'words.useBase': '改用原形',
  'words.exists': '“{w}” 已经在单词本里了', 'words.added': '已加入：{w}', 'words.loading': '正在加载字典…',
  'words.title': '单词本', 'words.count': '共 {n} 个 · 已掌握 {m} 个', 'words.searchPh': '搜索单词或释义',
  'words.all': '全部', 'words.learning': '学习中', 'words.mastered': '已掌握',
  'words.new': '添加单词', 'words.flash': '闪卡复习', 'words.empty': '单词本还是空的。学习时遇到生词就记下来吧！',
  'words.deleteConfirm': '删除单词 “{w}”？', 'words.markMastered': '标记为已掌握', 'words.markLearning': '标记为学习中',
  'flash.tap': '点卡片看释义', 'flash.again': '还不熟', 'flash.know': '我记住了', 'flash.done': '这一轮复习完了！', 'flash.none': '没有“学习中”的单词。',
  'flash.progress': '{i} / {n}',

  'stats.title': '统计', 'stats.days7': '最近 7 天', 'stats.days30': '最近 30 天',
  'stats.chartTitle': '每日学习时长', 'stats.total': '总时长', 'stats.avg': '日均', 'stats.checkinDays': '打卡天数', 'stats.goalDays': '达标天数',
  'stats.bySkill': '各技能时长', 'stats.calendar': '打卡日历', 'stats.table': '查看数据表', 'stats.date': '日期', 'stats.minutes': '分钟',
  'cal.done': '打卡', 'cal.bonus': '休息日打卡', 'cal.makeup': '补签', 'cal.missed': '未打卡', 'cal.rest': '休息日',

  'day.reflection': '当日总结', 'day.sessions': '学习记录', 'day.add': '补录一条', 'day.none': '这天没有学习记录。',
  'sess.edit': '修改记录', 'sess.new': '补录记录', 'sess.subject': '学习项目', 'sess.date': '日期', 'sess.time': '开始时间',
  'sess.minutes': '时长（分钟）', 'sess.deleteConfirm': '删除这条记录？', 'sess.delete': '删除',

  'set.title': '设置', 'set.lang': '语言', 'set.rules': '打卡规则', 'set.checkin': '打卡分钟数', 'set.goal': '每日目标分钟数',
  'set.restDays': '休息日', 'set.restHint': '休息日不学不中断连续天数；学满打卡分钟数会得到 ⭐ 并 +1 天。',
  'set.subjects': '学习项目', 'set.addSubject': '添加项目', 'set.hidden': '已隐藏',
  'set.backup': '备份', 'set.export': '导出备份', 'set.import': '导入备份', 'set.lastBackup': '上次备份：{d}', 'set.never': '从未备份',
  'set.importConfirm': '导入会覆盖当前所有数据，确定吗？', 'set.importOk': '导入成功', 'set.importFail': '文件格式不对，导入失败',
  'set.backupHint': '数据只保存在这台设备上。删除主屏幕图标或清除 Safari 数据会丢失记录，请定期导出备份。',
  'set.about': '关于', 'set.version': '版本 {v}', 'set.dictCredit': '字典数据：ECDICT（MIT 许可）',

  'subj.edit': '编辑项目', 'subj.new': '新项目', 'subj.nameZh': '中文名称', 'subj.nameEn': '英文名称', 'subj.emoji': '图标（emoji）',
  'subj.skill': '技能分组', 'subj.hide': '隐藏（不在选择列表显示，旧记录保留）', 'subj.needName': '请至少填写一个名称',


  'update.ready': '✨ 有新版本了，点这里更新',
  // ----- 玩（时间感练习）-----
  'play.row': '玩一会儿', 'play.today': '今天已玩 {n}', 'play.todayNone': '今天还没玩', 'play.start': '开始玩', 'play.resume': '回到“玩”',
  'play.pickTitle': '玩什么？', 'play.pickHint': '开始后不会显示时间。结束时先猜猜玩了多久，再看实际时间。',
  'play.pickNote': '用 iPad 或电脑学习、查资料，请从“开始学习”开始，不算在这里。',
  'play.calm1': '这次不显示时间。', 'play.calm2': '玩完回来点“结束”，', 'play.calm3': '先猜猜过了多久。', 'play.running': '计时中',
  'play.busyStudy': '正在学习计时，先结束再开始玩。', 'play.busyPlay': '正在玩，先结束再开始学习。',
  'play.tooShort': '不到 1 分钟，没有保存。',
  'guess.title': '你觉得玩了多久？', 'guess.hint': '凭感觉，不要看时钟', 'guess.titleStudy': '你觉得学了多久？',
  'guess.reveal': '揭晓', 'guess.skip': '跳过，直接看实际时间', 'guess.minUnit': '分钟',
  'reveal.title': '揭晓', 'reveal.guess': '你猜', 'reveal.actual': '实际',
  'reveal.more': '比你感觉的多了 {n} 分钟', 'reveal.less': '比你感觉的少了 {n} 分钟', 'reveal.exact': '猜得很准！',
  'reveal.trendLess': '最近 {n} 次：平均少估了 {p}%。玩的时候时间过得特别快，大人也常这样。',
  'reveal.trendMore': '最近 {n} 次：平均多估了 {p}%。需要动脑子的事，时间会显得更长。',
  'reveal.trendEven': '最近 {n} 次：平均估得很准！',
  'reveal.notePh': '玩了什么（可选）', 'reveal.noteEg': '例如：Minecraft', 'reveal.done': '完成', 'reveal.savedStudy': '继续',
  'play.today.list': '今天玩的记录', 'play.deleteConfirm': '删除这条记录？',
  'play.guessTag': '猜 {g}',
  'chart.kindStudy': '学习', 'chart.kindPlay': '玩',
  'pstats.chartTitle': '每天玩了多久', 'pstats.total': '总时长', 'pstats.avg': '日均', 'pstats.days': '玩的天数', 'pstats.per': '每次平均',
  'pstats.avgLine': '平均 {n}', 'pstats.chartNote': '单位：分钟。灰色底是周末。这里没有目标线，也不影响打卡。',
  'pstats.vs': '学习 vs 玩', 'pstats.vsNote': '只是并排看看，两边不能互相兑换。', 'pstats.study': '学习', 'pstats.play': '玩',
  'pstats.empty': '这段时间还没有玩的记录。',
  'sense.title': '时间感小实验', 'sense.intro': '空心圈是你猜的，实心点是实际时间。两个点越靠近，时间感越准。',
  'sense.lgGuess': '我猜的', 'sense.lgActual': '实际', 'sense.min': '分钟',
  'sense.sumLess': '玩的时候，你平均少估了 {p}%', 'sense.sumMore': '玩的时候，你平均多估了 {p}%', 'sense.sumEven': '玩的时候，你估得很准！',
  'sense.sumLessHint': '玩得投入时，时间会“变快”。看到这一点，就是时间感在变好。', 'sense.sumMoreHint': '慢慢来，多猜几次就会越来越准。',
  'sense.need': '再猜 {n} 次，就能看到你的时间感趋势。', 'sense.none': '玩完先猜一猜，这里就会出现你的“时间感”。',
  'sense.studyLine': '学习时（{n} 次）：平均{d} {p}%', 'sense.studyLess': '少估了', 'sense.studyMore': '多估了', 'sense.studyEven': '估得很准',
  'sense.studyEvenLine': '学习时（{n} 次）：估得很准', 'sense.studyOff': '学习时的猜测：在设置里打开“学习也猜一猜”后显示',
  'set.play': '玩时间', 'set.new': '新', 'set.playHide': '玩的时候隐藏计时', 'set.playHideHint': '打开后，玩的过程中不显示时间，结束时先猜再揭晓',
  'set.studyGuess': '学习结束时也猜一猜', 'set.studyGuessHint': '学习时同样先猜时长再揭晓，用来对比“学得久”的感觉',
  'set.playCats': '玩的类别', 'set.addCat': '添加', 'set.playNote': '没有额度，也不兑换学习时间，不影响学习打卡和连续天数。',
  'cat.edit': '编辑类别', 'cat.new': '新类别', 'cat.hide': '隐藏（不在选择列表显示，旧记录保留）',

  'common.save': '保存', 'common.confirm': '确定', 'common.cancel': '取消', 'common.close': '关闭', 'common.delete': '删除', 'common.edit': '修改',
  'wd.0': '周日', 'wd.1': '周一', 'wd.2': '周二', 'wd.3': '周三', 'wd.4': '周四', 'wd.5': '周五', 'wd.6': '周六',
  'wdShort.0': '日', 'wdShort.1': '一', 'wdShort.2': '二', 'wdShort.3': '三', 'wdShort.4': '四', 'wdShort.5': '五', 'wdShort.6': '六',
};

const en = {
  appName: 'Study Streak',
  'tab.today': 'Today', 'tab.stats': 'Stats', 'tab.words': 'Words', 'tab.settings': 'Settings',

  'today.title': 'Today',
  'streak.days': 'Day streak', 'streak.best': 'Best: {n} days',
  'cards.label': 'Streak savers', 'cards.next': '{n} more days for the next one', 'cards.full': 'Full',
  'today.minutes': 'Studied today',
  'today.goalDone': '🎉 Daily goal reached!', 'today.checked': '✅ Checked in · {n} to goal',
  'today.toCheckin': '{n} more to check in', 'today.restDay': 'Rest day · study {n} min to earn a ⭐',
  'today.restChecked': '⭐ You studied on a rest day. Awesome!',
  'today.lineCheckin': 'Check-in', 'today.lineGoal': 'Goal',
  'today.week': 'Last 7 days', 'today.moreStats': 'More stats', 'chart.viewDay': 'View day',
  'set.theme': 'Appearance', 'set.palette': 'Color scheme', 'mode.auto': 'Auto', 'mode.light': 'Light', 'mode.dark': 'Dark',
  'palette.sky': 'Sky', 'palette.forest': 'Forest', 'palette.sunset': 'Sunset', 'palette.lavender': 'Lavender', 'palette.mint': 'Mint',
  'today.start': 'Start studying', 'today.resume': 'Back to timer',
  'today.sessions': "Today's sessions", 'today.noSessions': 'Nothing yet. Tap the button above to begin.',
  'today.reflection': "Today's reflection", 'today.reflectionPh': 'What did you learn today? What was hard?',
  'makeup.banner': 'You missed {date}. Use 1 streak saver? ({n} left)', 'makeup.use': 'Use streak saver', 'makeup.done': '🛡️ Streak saved!',
  'backup.remind': "It's been over 30 days since your last backup. Export one in Settings.",

  'pick.title': 'What are you studying?',
  'skill.listen': 'Listening', 'skill.speak': 'Speaking', 'skill.read': 'Reading', 'skill.write': 'Writing', 'skill.vocab': 'Vocabulary', 'skill.other': 'Other',

  'timer.paused': 'Paused', 'timer.running': 'Focusing', 'timer.pause': 'Pause', 'timer.resume': 'Resume', 'timer.end': 'End',
  'timer.minimize': 'Minimize', 'timer.discard': 'Discard', 'timer.discardConfirm': 'Discard this session? Nothing will be saved.',
  'timer.addWord': 'Add word',
  'remind.pause': "You've been paused for over {n} minutes. End this session?", 'remind.long': "The timer has run for over {n} hours. Did you forget to end it?",
  'remind.endNow': 'End & save', 'remind.keepPaused': 'Stay paused', 'remind.still': "I'm still studying",

  'sum.title': 'How did it go?', 'sum.duration': 'Duration (minutes)', 'sum.note': 'What did you study?', 'sum.notePh': 'e.g. Watched episode 3 and learned 5 ocean words',
  'sum.stars': 'Self-rating', 'sum.words': 'New words', 'sum.save': 'Save', 'sum.skip': 'Skip, save time only',
  'sum.tooShort': 'Less than 1 minute — not saved.', 'sum.saved': 'Saved 👍',
  'celebrate.checkin': "🔥 You've checked in today!", 'celebrate.goal': "🎉 You hit today's {n}-minute goal!",

  'words.inputPh': 'Type an English word', 'words.meaningPh': 'Meaning (auto-filled, editable)', 'words.add': 'Add to word list',
  'words.notFound': 'Not in the dictionary. You can type the meaning yourself.', 'words.baseHint': 'Base form: {w}', 'words.useBase': 'Use base form',
  'words.exists': '"{w}" is already in your list', 'words.added': 'Added: {w}', 'words.loading': 'Loading dictionary…',
  'words.title': 'Word List', 'words.count': '{n} words · {m} mastered', 'words.searchPh': 'Search words or meanings',
  'words.all': 'All', 'words.learning': 'Learning', 'words.mastered': 'Mastered',
  'words.new': 'Add word', 'words.flash': 'Flashcards', 'words.empty': 'Your word list is empty. Add new words as you study!',
  'words.deleteConfirm': 'Delete "{w}"?', 'words.markMastered': 'Mark as mastered', 'words.markLearning': 'Mark as learning',
  'flash.tap': 'Tap the card to see the meaning', 'flash.again': 'Not yet', 'flash.know': 'Got it', 'flash.done': 'Round complete!', 'flash.none': 'No words in "Learning".',
  'flash.progress': '{i} / {n}',

  'stats.title': 'Stats', 'stats.days7': 'Last 7 days', 'stats.days30': 'Last 30 days',
  'stats.chartTitle': 'Daily study time', 'stats.total': 'Total', 'stats.avg': 'Daily average', 'stats.checkinDays': 'Check-in days', 'stats.goalDays': 'Goal days',
  'stats.bySkill': 'Time by skill', 'stats.calendar': 'Streak calendar', 'stats.table': 'Show data table', 'stats.date': 'Date', 'stats.minutes': 'Minutes',
  'cal.done': 'Checked in', 'cal.bonus': 'Rest-day bonus', 'cal.makeup': 'Saved', 'cal.missed': 'Missed', 'cal.rest': 'Rest day',

  'day.reflection': 'Reflection', 'day.sessions': 'Sessions', 'day.add': 'Add a record', 'day.none': 'No sessions on this day.',
  'sess.edit': 'Edit record', 'sess.new': 'Add record', 'sess.subject': 'Activity', 'sess.date': 'Date', 'sess.time': 'Start time',
  'sess.minutes': 'Duration (minutes)', 'sess.deleteConfirm': 'Delete this record?', 'sess.delete': 'Delete',

  'set.title': 'Settings', 'set.lang': 'Language', 'set.rules': 'Check-in rules', 'set.checkin': 'Check-in minutes', 'set.goal': 'Daily goal (minutes)',
  'set.restDays': 'Rest days', 'set.restHint': "Skipping a rest day won't break your streak. Studying enough on one earns a ⭐ and +1 day.",
  'set.subjects': 'Activities', 'set.addSubject': 'Add activity', 'set.hidden': 'Hidden',
  'set.backup': 'Backup', 'set.export': 'Export backup', 'set.import': 'Import backup', 'set.lastBackup': 'Last backup: {d}', 'set.never': 'Never backed up',
  'set.importConfirm': 'Importing replaces ALL current data. Continue?', 'set.importOk': 'Import complete', 'set.importFail': "That file isn't a valid backup",
  'set.backupHint': 'Data is stored only on this device. Removing the home-screen icon or clearing Safari data erases it, so export a backup regularly.',
  'set.about': 'About', 'set.version': 'Version {v}', 'set.dictCredit': 'Dictionary data: ECDICT (MIT License)',

  'subj.edit': 'Edit activity', 'subj.new': 'New activity', 'subj.nameZh': 'Chinese name', 'subj.nameEn': 'English name', 'subj.emoji': 'Icon (emoji)',
  'subj.skill': 'Skill group', 'subj.hide': 'Hide (old records are kept)', 'subj.needName': 'Please enter at least one name',


  'update.ready': '✨ A new version is ready. Tap to update',
  // ----- Play (time-sense practice) -----
  'play.row': 'Play time', 'play.today': 'Played today: {n}', 'play.todayNone': 'No play yet today', 'play.start': 'Start play', 'play.resume': 'Back to play',
  'play.pickTitle': 'What are you playing?', 'play.pickHint': "The clock stays hidden. When you finish, guess how long it was, then see the real time.",
  'play.pickNote': 'Studying on the iPad or computer? Use "Start studying" instead. It does not count here.',
  'play.calm1': 'The time is hidden this round.', 'play.calm2': 'When you are done, tap End', 'play.calm3': 'and guess how long it was.', 'play.running': 'Playing',
  'play.busyStudy': 'A study timer is running. End it before you start playing.', 'play.busyPlay': 'You are playing right now. End it before you start studying.',
  'play.tooShort': 'Less than 1 minute — not saved.',
  'guess.title': 'How long do you think it was?', 'guess.hint': 'Go by feeling. No peeking at the clock.', 'guess.titleStudy': 'How long do you think you studied?',
  'guess.reveal': 'Reveal', 'guess.skip': 'Skip, just show the real time', 'guess.minUnit': 'min',
  'reveal.title': 'Reveal', 'reveal.guess': 'Your guess', 'reveal.actual': 'Actual',
  'reveal.more': '{n} min more than it felt', 'reveal.less': '{n} min less than it felt', 'reveal.exact': 'Spot on!',
  'reveal.trendLess': 'Last {n} times: you guessed {p}% too short on average. Time flies when you play. Adults do this too.',
  'reveal.trendMore': 'Last {n} times: you guessed {p}% too long on average. Thinking hard makes time feel longer.',
  'reveal.trendEven': 'Last {n} times: your guesses were right on average!',
  'reveal.notePh': 'What did you play? (optional)', 'reveal.noteEg': 'e.g. Minecraft', 'reveal.done': 'Done', 'reveal.savedStudy': 'Continue',
  'play.today.list': "Today's play", 'play.deleteConfirm': 'Delete this record?',
  'play.guessTag': 'guess {g}',
  'chart.kindStudy': 'Study', 'chart.kindPlay': 'Play',
  'pstats.chartTitle': 'Play time per day', 'pstats.total': 'Total', 'pstats.avg': 'Daily average', 'pstats.days': 'Days played', 'pstats.per': 'Per session',
  'pstats.avgLine': 'Avg {n}', 'pstats.chartNote': 'Minutes. Grey background = weekend. No goal line, and it does not affect your streak.',
  'pstats.vs': 'Study vs play', 'pstats.vsNote': 'Just side by side. They cannot be traded for each other.', 'pstats.study': 'Study', 'pstats.play': 'Play',
  'pstats.empty': 'No play records in this period.',
  'sense.title': 'Time-sense experiment', 'sense.intro': 'The hollow circle is your guess, the solid dot is the real time. The closer they are, the better your time sense.',
  'sense.lgGuess': 'My guess', 'sense.lgActual': 'Actual', 'sense.min': 'min',
  'sense.sumLess': 'When you play, you guess {p}% too short on average', 'sense.sumMore': 'When you play, you guess {p}% too long on average', 'sense.sumEven': 'When you play, your guesses are spot on!',
  'sense.sumLessHint': 'When you are absorbed, time seems to speed up. Noticing that means your time sense is improving.', 'sense.sumMoreHint': 'Keep guessing. You will get closer each time.',
  'sense.need': '{n} more guesses to see your trend.', 'sense.none': 'Guess after you play and your time sense will show up here.',
  'sense.studyLine': 'Studying ({n} times): {d} {p}% on average', 'sense.studyLess': 'guessed too short by', 'sense.studyMore': 'guessed too long by', 'sense.studyEven': 'guessed right, off by only',
  'sense.studyEvenLine': 'Studying ({n} times): guesses were right on average', 'sense.studyOff': 'Study guesses: turn on "Guess for studying too" in Settings',
  'set.play': 'Play time', 'set.new': 'New', 'set.playHide': 'Hide the clock while playing', 'set.playHideHint': 'When on, no time is shown while playing. Guess first, then reveal.',
  'set.studyGuess': 'Guess for studying too', 'set.studyGuessHint': 'Guess the length after studying too, to compare with how long it felt',
  'set.playCats': 'Play types', 'set.addCat': 'Add', 'set.playNote': 'No limits, no trading for study time, and no effect on your streak.',
  'cat.edit': 'Edit type', 'cat.new': 'New type', 'cat.hide': 'Hide (old records are kept)',

  'common.save': 'Save', 'common.confirm': 'OK', 'common.cancel': 'Cancel', 'common.close': 'Close', 'common.delete': 'Delete', 'common.edit': 'Edit',
  'wd.0': 'Sunday', 'wd.1': 'Monday', 'wd.2': 'Tuesday', 'wd.3': 'Wednesday', 'wd.4': 'Thursday', 'wd.5': 'Friday', 'wd.6': 'Saturday',
  'wdShort.0': 'S', 'wdShort.1': 'M', 'wdShort.2': 'T', 'wdShort.3': 'W', 'wdShort.4': 'T', 'wdShort.5': 'F', 'wdShort.6': 'S',
};

export const STRINGS = { zh, en };

let lang = 'zh';
export const setLang = (l) => { lang = STRINGS[l] ? l : 'zh'; document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : 'en'; };
export const getLang = () => lang;

export function t(key, params) {
  let s = STRINGS[lang][key] ?? STRINGS.zh[key] ?? key;
  if (params) for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(v);
  return s;
}

/** 分钟数 → 可读时长 */
export function fmtMin(m) {
  m = Math.round(m);
  const h = Math.floor(m / 60), mm = m % 60;
  if (lang === 'zh') return h ? `${h} 小时${mm ? ` ${mm} 分` : ''}` : `${mm} 分钟`;
  return h ? `${h}h${mm ? ` ${mm}m` : ''}` : `${mm} min`;
}

/** 'YYYY-MM-DD' → 显示日期 */
export function fmtDate(key, style = 'short') {
  const [y, m, d] = key.split('-').map(Number);
  const wd = new Date(y, m - 1, d).getDay();
  if (lang === 'zh') {
    const base = `${m}月${d}日`;
    return style === 'long' ? `${y}年${base} ${t('wd.' + wd)}` : `${base} ${t('wd.' + wd)}`;
  }
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const wdn = t('wd.' + wd);
  return style === 'long' ? `${wdn}, ${months[m - 1]} ${d}, ${y}` : `${wdn.slice(0, 3)}, ${months[m - 1]} ${d}`;
}

export function fmtMonth(y, m) {
  if (lang === 'zh') return `${y}年${m}月`;
  return new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
}
