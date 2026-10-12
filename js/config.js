// ============================================================
//  config.js — 默认规则与学习项目。改规则/项目优先改这里。
// ============================================================

export const APP_VERSION = '1.3.1';

export const DEFAULT_SETTINGS = {
  lang: 'zh',               // 'zh' | 'en'
  checkinMinutes: 30,       // 当天累计满多少分钟算打卡
  goalMinutes: 60,          // 每日目标
  restDays: [0, 6],         // 休息日：0=周日 … 6=周六
  cardEvery: 5,             // 连续打卡每满几天得 1 张补签卡
  cardMax: 3,               // 补签卡最多存几张
  makeupWindow: 3,          // 只能补最近几天
  minSessionMinutes: 1,     // 少于此分钟数的记录自动丢弃
  pauseRemindMinutes: 30,   // 暂停多久提醒
  longSessionMinutes: 180,  // 连续计时多久提醒
  lastBackup: null,
  theme: 'auto',            // 'auto' 跟随系统 | 'light' | 'dark'
  palette: 'sky',           // 见下方 PALETTES
  playHideClock: true,      // 玩的时候不显示计时
  studyGuess: false,        // 学习结束时也先猜时长
  guessMinSessions: 5,      // 猜满几次后才显示“平均少估/多估”趋势
};

// 配色方案（色卡）：每套都有浅色和深色两组颜色。
// bg 页面底色 · surface 卡片 · surface2 输入框/次级底色 · line 分隔线 · accent 按钮/选中 · fire 连续天数
// 想加新色卡：复制一组，改 id 和颜色，再到 i18n.js 加名字（palette.<id>）。
export const PALETTES = [
  { id: 'sky',
    light: { bg: '#f3f5f9', surface: '#ffffff', surface2: '#eceff4', line: '#dde2ea', accent: '#2a78d6', fire: '#e8622c' },
    dark:  { bg: '#111418', surface: '#1b1f26', surface2: '#252a33', line: '#323844', accent: '#4a92ea', fire: '#ff7a45' } },
  { id: 'forest',
    light: { bg: '#f1f4ee', surface: '#ffffff', surface2: '#e8ece3', line: '#d6ddd0', accent: '#2f7d4a', fire: '#d9761c' },
    dark:  { bg: '#101510', surface: '#1a201a', surface2: '#242b24', line: '#313a31', accent: '#5bbf7a', fire: '#f0a04b' } },
  { id: 'sunset',
    light: { bg: '#f8f2ec', surface: '#fffdfb', surface2: '#f1e8e0', line: '#e5d8cc', accent: '#c8501c', fire: '#d63b54' },
    dark:  { bg: '#17120f', surface: '#221b17', surface2: '#2d2420', line: '#3b302a', accent: '#f07a45', fire: '#ff6b81' } },
  { id: 'lavender',
    light: { bg: '#f4f2f9', surface: '#ffffff', surface2: '#ebe8f4', line: '#ddd8ea', accent: '#6a4fd0', fire: '#d6457e' },
    dark:  { bg: '#131219', surface: '#1d1b26', surface2: '#272433', line: '#353145', accent: '#9a8cf0', fire: '#f07aa5' } },
  { id: 'mint',
    light: { bg: '#eef6f4', surface: '#ffffff', surface2: '#e2eeeb', line: '#cfe0dc', accent: '#0f7f77', fire: '#e8622c' },
    dark:  { bg: '#0f1615', surface: '#18211f', surface2: '#222d2b', line: '#2f3d3a', accent: '#2bb5a8', fire: '#ff8a55' } },
];
export const PALETTE_KEYS = ['bg', 'surface', 'surface2', 'line', 'accent', 'fire'];

// 技能分组：顺序 = 柱状图堆叠顺序 = 颜色顺序（颜色在 css/app.css 的 --skill-*）
export const SKILLS = [
  { id: 'listen', icon: '🎧' },
  { id: 'speak',  icon: '🗣️' },
  { id: 'read',   icon: '📖' },
  { id: 'write',  icon: '✍️' },
  { id: 'vocab',  icon: '🔤' },
  { id: 'other',  icon: '⭐' },
];

export const DEFAULT_SUBJECTS = [
  { id: 'documentary', skill: 'listen', emoji: '🎬', name: { en: 'Documentary', zh: '跟看纪录片' } },
  { id: 'dictation',   skill: 'listen', emoji: '✏️', name: { en: 'Dictation', zh: '听写句子' } },
  { id: 'podcast',     skill: 'listen', emoji: '🎧', name: { en: 'Podcast / Audiobook', zh: '听播客 / 有声书' } },
  { id: 'aichat',      skill: 'speak',  emoji: '🤖', name: { en: 'Chat with AI', zh: '和 AI 英语聊天' } },
  { id: 'shadowing',   skill: 'speak',  emoji: '🗣️', name: { en: 'Shadowing', zh: '影子跟读' } },
  { id: 'reading',     skill: 'read',   emoji: '📖', name: { en: 'Reading', zh: '阅读文章' } },
  { id: 'workbook',    skill: 'write',  emoji: '📝', name: { en: 'Workbook Exercises', zh: '书本习题' } },
  { id: 'journal',     skill: 'write',  emoji: '📓', name: { en: 'Journal / Writing', zh: '英语日记 / 写作' } },
  { id: 'lookup',      skill: 'vocab',  emoji: '🔍', name: { en: 'Look Up New Words', zh: '查找学习生词' } },
  { id: 'review',      skill: 'vocab',  emoji: '🃏', name: { en: 'Word Review', zh: '复习单词卡' } },
  { id: 'other',       skill: 'other',  emoji: '⭐', name: { en: 'Other', zh: '其他' } },
];

// 玩的类别（只用来培养时间感，不和学习互换）。ci = 颜色序号，对应 css 的 --play-<ci>，一旦分配不要改。
export const DEFAULT_PLAY_CATS = [
  { id: 'pc',    ci: 0, emoji: '🎮', name: { en: 'PC games', zh: '电脑游戏' } },
  { id: 'ipad',  ci: 1, emoji: '📱', name: { en: 'iPad fun', zh: 'iPad 娱乐' } },
  { id: 'phone', ci: 2, emoji: '📲', name: { en: 'Phone / short videos', zh: '玩手机 / 刷短视频' } },
];
export const PLAY_COLORS = 6;
