# MySQL 服务检查指南

## 🔍 检查 MySQL 是否运行

### Windows 系统

#### 方法 1：通过服务管理器
1. 按 `Win + R` 打开运行对话框
2. 输入 `services.msc` 并回车
3. 在服务列表中找到 `MySQL` 或 `MySQL80`（版本号可能不同）
4. 检查状态是否为"正在运行"
5. 如果未运行，右键点击 → 启动

#### 方法 2：通过命令行
```powershell
# 查看 MySQL 服务状态
Get-Service -Name MySQL*

# 启动 MySQL 服务
Start-Service -Name MySQL80

# 或者使用 net 命令
net start MySQL80
```

#### 方法 3：通过任务管理器
1. 按 `Ctrl + Shift + Esc` 打开任务管理器
2. 切换到"服务"标签
3. 查找 MySQL 相关服务

### Linux 系统

```bash
# 检查 MySQL 服务状态
sudo systemctl status mysql
# 或
sudo service mysql status

# 启动 MySQL 服务
sudo systemctl start mysql
# 或
sudo service mysql start

# 设置开机自启
sudo systemctl enable mysql
```

### macOS 系统

```bash
# 检查 MySQL 服务状态
brew services list | grep mysql

# 启动 MySQL 服务
brew services start mysql

# 或使用 launchctl
sudo launchctl load -w /Library/LaunchDaemons/com.oracle.oss.mysql.mysqld.plist
```

## 🔧 常见问题解决

### 1. MySQL 服务未安装

**Windows:**
- 下载 MySQL Installer: https://dev.mysql.com/downloads/installer/
- 或使用 XAMPP/WAMP 等集成环境

**Linux:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server

# CentOS/RHEL
sudo yum install mysql-server
```

**macOS:**
```bash
brew install mysql
```

### 2. 端口被占用

检查 3306 端口是否被占用：

**Windows:**
```powershell
netstat -ano | findstr :3306
```

**Linux/macOS:**
```bash
lsof -i :3306
# 或
netstat -an | grep 3306
```

如果端口被占用，可以：
- 停止占用端口的程序
- 或修改 MySQL 端口配置

### 3. 忘记 MySQL root 密码

**Windows:**
1. 停止 MySQL 服务
2. 使用 `--skip-grant-tables` 启动 MySQL
3. 重置密码

**Linux/macOS:**
```bash
sudo mysql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

### 4. 测试 MySQL 连接

使用命令行测试连接：

```bash
# Windows (如果 MySQL 在 PATH 中)
mysql -u root -p

# Linux/macOS
mysql -u root -p
```

如果能够连接，说明 MySQL 服务正常运行。

## 📝 配置检查清单

- [ ] MySQL 服务已安装
- [ ] MySQL 服务正在运行
- [ ] 端口 3306 未被占用
- [ ] 知道 root 用户密码
- [ ] `.env` 文件配置正确
- [ ] 可以手动连接 MySQL

## 🚀 快速测试

运行以下命令测试 MySQL 连接：

```bash
# 在 backend 目录下
node -e "const mysql = require('mysql2/promise'); mysql.createConnection({host:'localhost',user:'root',password:'你的密码'}).then(() => console.log('✅ 连接成功')).catch(e => console.log('❌ 连接失败:', e.message))"
```

---

如果以上方法都无法解决问题，请：
1. 检查 MySQL 安装日志
2. 查看 MySQL 错误日志
3. 联系系统管理员或技术支持












