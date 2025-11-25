# 启动 MySQL 服务的 PowerShell 脚本
# 需要以管理员身份运行

Write-Host "正在启动 MySQL 服务..." -ForegroundColor Yellow

try {
    Start-Service -Name MySQL80 -ErrorAction Stop
    Write-Host "✅ MySQL 服务启动成功！" -ForegroundColor Green
    Write-Host ""
    Write-Host "现在可以运行: npm run init-db" -ForegroundColor Cyan
} catch {
    Write-Host "❌ MySQL 服务启动失败！" -ForegroundColor Red
    Write-Host ""
    Write-Host "错误信息: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "请尝试以下方法：" -ForegroundColor Yellow
    Write-Host "1. 以管理员身份运行 PowerShell" -ForegroundColor White
    Write-Host "2. 或使用服务管理器手动启动 MySQL80 服务" -ForegroundColor White
    Write-Host ""
    Read-Host "按 Enter 键退出"
}





