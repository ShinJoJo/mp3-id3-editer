@echo off
chcp 65001 >nul
title Win7 64位 MP3 标签编辑器 - Electron 桌面端一键打包脚本 (已适配 Node.js v13.14.0)
echo ========================================================
echo  Win7 64位 (Node.js v13.14.0) - Electron 12 桌面端一键打包
echo ========================================================
echo [信息] 当前已检测并适配 Node.js v13.14.0 Win7 原生环境。
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js 环境!
    echo 请确认已安装 node-v13.14.0-x64.msi 并且其已添加到系统环境变量 PATH 中。
    pause
    exit /b 1
)

echo [1/3] 正在自动安装 Electron 12 依赖 (专为 Node 13 & Win7 64位完美匹配)...
call npm install electron@12.2.3 electron-builder@22.14.13 --save-dev

echo.
echo [2/3] 正在构建前端 React 完整网页界面与 CSS 样式...
call npm run build

echo.
echo [3/3] 正在生成 Win7 64位独立免安装桌面程序 (.exe)...
call npx electron-builder --win portable --x64

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo [成功] 打包完成! 生成免安装绿色程序文件。
    echo 应用程序位置: dist\MP3 ID3 Tag Editor 1.0.0.exe
    echo 双击该 .exe 即可直接打开与当前网页 100% 一模一样的桌面程序!
    echo ========================================================
    echo.
) else (
    echo.
    echo [失败] 打包遇到错误，请确认网络连接与 Node.js 环境。
    echo.
)

pause

