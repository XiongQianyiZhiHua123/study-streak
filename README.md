# Study Streak 学习打卡

孩子英语学习计时打卡工具（网页应用，可添加到 iPad 主屏幕，离线使用）。设计说明见 `DESIGN.md`。

## 发布到 GitHub Pages（一次性，约 10 分钟）

1. 在 https://github.com 注册账号并登录。
2. 右上角 **+ → New repository**，名称填 `study-streak`，选 **Public**（免费账号的 Pages 需要公开仓库；公开的只是程序，孩子的数据不在里面），点 **Create repository**。
3. 在新仓库页面点 **uploading an existing file**，把解压后文件夹**里面的所有内容**（`index.html`、`css`、`js`、`data`、`icons` 等）一起拖进去，点 **Commit changes**。
4. 进入仓库 **Settings → Pages**，Source 选 **Deploy from a branch**，Branch 选 **main**、目录 **/(root)**，点 **Save**。
5. 等 1–2 分钟，页面顶部会显示网址：`https://你的用户名.github.io/study-streak/`

## 安装到 iPad

1. 用 iPad 的 **Safari** 打开上面的网址（需要联网）。
2. 点 **分享按钮 → 添加到主屏幕 → 添加**。
3. 从桌面图标打开一次，等页面加载完成。之后断网也能用。

## 以后更新（改了功能或小修改之后）

1. **改好文件**：规则/项目在 `js/config.js`，文字在 `js/i18n.js`，颜色在 `css/app.css`，功能在 `js/app.js`。
2. **改版本号**（必须，否则 iPad 不会更新）：打开 `sw.js`，把第一行 `const VERSION = 'v1.3.1'` 改成新值，如 `'v1.3.2'`。
3. **上传到 GitHub**：进入仓库页面 → 点进要改的文件（如 `sw.js`）→ 右上角铅笔图标 ✎ 编辑 → 粘贴新内容 → **Commit changes**。
   新增或改了很多文件时：仓库首页 **Add file → Upload files**，把改过的文件拖进去（同名会覆盖；放在子文件夹里的要先进入对应文件夹再上传），点 **Commit changes**。
4. 等 1–2 分钟（仓库页面的 Actions 标签里 “pages build and deployment” 出现绿色对勾就是发布完成）。
5. **iPad 自动更新**：iPad 联网，打开 App（或从后台回到 App），会自动检查；装好后底部出现“✨ 有新版本了，点这里更新”，点一下即可。孩子的记录不受影响。

## 数据与备份

- 所有记录只存在 iPad 本机。
- **删除主屏幕图标会同时删除数据。** 请定期在“设置 → 导出备份”保存一份 JSON 文件（可存到“文件”App 或 iCloud Drive）。
- 换设备时在“设置 → 导入备份”恢复。

## 测试

```
node tests/logic.test.mjs          # 规则单元测试
python3 -m http.server 8765 &      # 在项目根目录启动本地服务
python3 tests/e2e.py               # 浏览器自动化测试（需 pip install playwright）
```

字典数据来自 [ECDICT](https://github.com/skywind3000/ECDICT)（MIT 许可），精简为约 3.3 万常用词。
