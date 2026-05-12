# 哈基米大冒险

基于 Cocos Creator 3.8.8 开发的 2D 横版跑酷 Demo。

## 打开项目

1. 安装 Cocos Creator 3.8.8。
2. 使用 Cocos Dashboard 打开本仓库根目录。
3. 等待资源导入完成。
4. 打开 `assets/scenes/Main.scene`。
5. 点击预览运行。

## 已提交内容

- `assets/`：场景、脚本、图片资源以及 Cocos `.meta` 文件。
- `settings/v2/`：Cocos 项目设置。
- `package.json`：项目名称、UUID 和 Creator 版本。
- `.creator/default-meta.json`：默认资源 meta 设置。
- `.vscode/preview.yml`：云端 Web 预览配置。
- `start_web_demo.py` / `run_web_demo.bat`：Web 构建产物的本地演示辅助脚本。

## 未提交内容

以下目录为 Cocos 或本机工具生成内容，clone 后会重新生成：

- `library/`
- `temp/`
- `local/`
- `build/`
- `native/`
- `profiles/`
- `extensions/cocos-mcp-server/`
- `node_modules/`

## Web 演示

构建 Web Desktop 后，将 `start_web_demo.py` 放入构建出的 `web-desktop` 目录，运行：

```bash
python start_web_demo.py --host 0.0.0.0 --port 5000 --no-browser
```

浏览器访问对应服务器地址和端口即可。
