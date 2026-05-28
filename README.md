# 哈基米大冒险

基于 Cocos Creator 3.8.8 开发的 2D 横版跑酷 Demo。项目目标是做成可交付演示版本，包含主菜单、商店/升级、设置、结算、跑酷玩法、金币收集、道具、障碍、导弹预警等内容。

## 打开项目

1. 安装 Cocos Creator 3.8.8。
2. 使用 Cocos Dashboard 打开本仓库根目录。
3. 等待资源导入完成。
4. 打开 `assets/scenes/Main.scene`。
5. 点击预览运行。

## Web 演示

如果已经构建出 `web-desktop-001`，云端预览配置位于 `.vscode/preview.yml`，会在该目录下启动静态服务：

```bash
python -m http.server 5000 --bind 0.0.0.0
```

本地 Web 构建产物也可以使用 `run_web_demo.bat` 辅助启动。

## 已提交内容

- `assets/`：场景、脚本、图片、字体资源以及 Cocos `.meta` 文件。
- `settings/v2/`：Cocos 项目设置。
- `package.json`：项目名称、UUID 和 Creator 版本。
- `.creator/default-meta.json`：默认资源 meta 设置。
- `.vscode/preview.yml`：云端 Web 预览配置。
- `start_web_demo.py` / `run_web_demo.bat`：Web 构建产物演示辅助脚本。

## 未提交内容

以下目录通常由 Cocos 或本机工具生成，clone 后会重新生成：

- `library/`
- `temp/`
- `local/`
- `build/`
- `native/`
- `profiles/`
- `extensions/cocos-mcp-server/`
- `node_modules/`

## 更新说明

### 2026-05-28

- 接入可爱风格中文字体 `ZCOOL KuaiLe`，统一替换 HUD、按钮、商店、设置、结算和排行榜文字。
- 修复左上分数栏宽度不足导致的缩放闪烁问题，并在分数下方新增里程显示。
- 重绘并替换磁铁、护盾、冲刺、双倍分四类道具特效，增加角色跟随动效。
- 新增导弹危险机制：到达一定里程后出现闪烁预警线，随后导弹从右向左发射，护盾和冲刺可抵挡。
- 调整无地面背景与新跑道的对齐方式，避免背景底部被跑道遮挡。
- 更新主菜单标题图、无缝跑道素材和云端 Web 预览配置。

