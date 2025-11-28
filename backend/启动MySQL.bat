@echo off
echo 正在启动 MySQL 服务...
net start MySQL80
if %errorlevel% == 0 (
    echo ✅ MySQL 服务启动成功！
    echo.
    echo 现在可以运行: npm run init-db
) else (
    echo ❌ MySQL 服务启动失败！
    echo.
    echo 请以管理员身份运行此脚本：
    echo 1. 右键点击此文件
    echo 2. 选择"以管理员身份运行"
    echo.
    pause
)












