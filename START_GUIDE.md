# 快速启动指南

## 🚀 一键启动（推荐）

### Windows用户
直接双击 `start.bat` 文件

### Linux/Mac用户
```bash
chmod +x start.sh
./start.sh
```

## 📋 手动启动

### 1. 启动后端
打开第一个终端窗口：
```bash
cd D:\PythonProjects\geektime-bootcamp-ai\w2\db_query\backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. 启动前端  
打开第二个终端窗口：
```bash
cd D:\PythonProjects\geektime-bootcamp-ai\w2\db_query\frontend
npm run dev
```

## 🧪 验证功能

### 访问地址
- **前端界面**: http://localhost:5173
- **后端API**: http://localhost:8000
- **API文档**: http://localhost:8000/docs

### 测试导出功能

#### 方法1: 通过界面测试
1. 打开 http://localhost:5173
2. 创建或选择数据库连接
3. 执行SQL查询（如：`SELECT * FROM information_schema.tables LIMIT 10`）
4. 查看查询结果
5. 点击右上角"Export"按钮
6. 选择格式（CSV/JSON/Excel）
7. 点击"Export"按钮
8. 验证文件是否下载

#### 方法2: 通过API文档测试
1. 打开 http://localhost:8000/docs
2. 找到 `POST /api/v1/dbs/{name}/export` 端点
3. 点击 "Try it out"
4. 填写测试数据：
```json
{
  "format": "csv",
  "maxRows": 10,
  "sql": "SELECT * FROM information_schema.tables LIMIT 10"
}
```
5. 点击 "Execute"
6. 检查返回的文件内容

#### 方法3: 使用测试脚本
```bash
python test_export.py
```

## 🔍 检查点

启动成功后，你应该看到：

### 后端
```
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 前端
```
VITE v7.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.x.x:5173/
```

## ⚠️ 常见问题

### 端口被占用
```bash
# 后端改用其他端口
uvicorn app.main:app --reload --port 8001

# 前端改用其他端口，修改 vite.config.ts
```

### 依赖缺失
```bash
# 后端
pip install fastapi uvicorn sqlmodel pandas openpyxl

# 前端
npm install
```

### 数据库连接问题
- 确保数据库服务正在运行
- 检查连接字符串是否正确
- 查看后端日志中的错误信息

## 📁 重要文件位置

- **启动脚本**: `start.bat` / `start.sh`
- **测试脚本**: `test_export.py`
- **实现文档**: `EXPORT_IMPLEMENTATION.md`
- **使用指南**: `EXPORT_USAGE_GUIDE.md`

## 🎯 导出功能特性

✅ 支持3种格式：CSV、JSON、Excel
✅ 最多导出1000行
✅ 用户友好的格式选择界面
✅ 自动文件下载
✅ 错误处理和用户反馈

祝测试顺利！🎉