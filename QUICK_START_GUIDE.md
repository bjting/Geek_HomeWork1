# 快速启动指南 - 验证导出功能

由于系统中没有安装`uv`工具，这里提供直接启动前后端的方法：

## 方法一：手动启动（推荐）

### 1. 启动后端

打开第一个终端窗口：

```bash
# 进入后端目录
cd D:\PythonProjects\geektime-bootcamp-ai\w2\db_query\backend

# 激活虚拟环境（如果使用conda）
conda activate your_env_name

# 或者使用系统的Python环境
# 确保安装了依赖
pip install fastapi uvicorn sqlmodel pandas openpyxl asyncpg aiomysql PyMySQL python-dotenv

# 启动后端服务器
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

预期输出：
```
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### 2. 启动前端

打开第二个终端窗口：

```bash
# 进入前端目录
cd D:\PythonProjects\geektime-bootcamp-ai\w2\db_query\frontend

# 确保安装了依赖
npm install

# 启动前端开发服务器
npm run dev
```

预期输出：
```
VITE v7.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.x.x:5173/
➜  press h + enter to show help
```

## 方法二：安装UV工具后使用Makefile

如果想要使用Makefile，先安装UV：

```bash
# 安装UV
pip install uv

# 然后使用Makefile命令
cd D:\PythonProjects\geektime-bootcamp-ai\w2\db_query

# 安装依赖
make install

# 启动服务器（会同时启动前后端）
make dev
```

## 验证步骤

### 1. 检查后端是否正常

打开浏览器访问：
- 后端API：http://localhost:8000
- API文档：http://localhost:8000/docs

你应该看到FastAPI的欢迎页面或API文档页面。

### 2. 检查前端是否正常

打开浏览器访问：
- 前端应用：http://localhost:5173

你应该看到数据库查询工具的界面。

### 3. 测试导出功能

1. **创建数据库连接**
   - 点击左侧的数据库连接
   - 选择或创建一个数据库连接

2. **执行查询**
   - 在SQL编辑器中输入查询语句，比如：
     ```sql
     SELECT * FROM your_table LIMIT 100
     ```
   - 点击"Execute"按钮

3. **测试导出**
   - 查看查询结果表格
   - 点击右上角的"Export"按钮
   - 在弹出的对话框中选择格式（CSV/JSON/Excel）
   - 点击"Export"按钮
   - 验证文件是否成功下载

### 4. 测试API端点（可选）

使用Postman或curl测试导出API：

```bash
# 测试CSV导出
curl -X POST "http://localhost:8000/api/v1/dbs/your_db_name/export" \
  -H "Content-Type: application/json" \
  -d '{
    "format": "csv",
    "maxRows": 10,
    "sql": "SELECT * FROM your_table LIMIT 10"
  }' \
  --output test_export.csv

# 测试JSON导出
curl -X POST "http://localhost:8000/api/v1/dbs/your_db_name/export" \
  -H "Content-Type: application/json" \
  -d '{
    "format": "json",
    "maxRows": 5,
    "sql": "SELECT id, name FROM your_table LIMIT 5"
  }' \
  --output test_export.json

# 测试Excel导出
curl -X POST "http://localhost:8000/api/v1/dbs/your_db_name/export" \
  -H "Content-Type: application/json" \
  -d '{
    "format": "excel",
    "maxRows": 20,
    "sql": "SELECT * FROM your_table LIMIT 20"
  }' \
  --output test_export.xlsx
```

## 常见问题解决

### 后端启动失败

**问题：依赖缺失**
```bash
# 安装缺失的依赖
cd D:\PythonProjects\geektime-bootcamp-ai\w2\db_query\backend
pip install fastapi uvicorn sqlmodel pandas openpyxl asyncpg aiomysql PyMySQL python-dotenv
```

**问题：数据库配置**
- 确保`backend/.env`文件存在并正确配置
- 如果使用PostgreSQL，确保数据库连接字符串正确

### 前端启动失败

**问题：依赖缺失**
```bash
cd D:\PythonProjects\geektime-bootcamp-ai\w2\db_query\frontend
npm install
```

**问题：端口冲突**
```bash
# 修改端口（如果8000或5173被占用）
# 后端：uvicorn app.main:app --reload --port 8001
# 前端：修改vite.config.ts中的server.port
```

### 导出功能测试失败

**问题：没有查询结果**
- 确保执行了有效的SELECT查询
- 检查查询是否返回了数据行

**问题：下载失败**
- 检查浏览器控制台是否有错误
- 确保后端服务器正在运行
- 检查网络请求是否成功

## 快速测试脚本

如果想要快速测试导出API，可以创建一个Python测试脚本：

```python
import requests

# 配置
BASE_URL = "http://localhost:8000"
DB_NAME = "your_database_name"  # 替换为实际的数据库名

# 测试数据
test_queries = [
    {
        "format": "csv",
        "maxRows": 10,
        "sql": "SELECT * FROM information_schema.tables LIMIT 10"
    },
    {
        "format": "json", 
        "maxRows": 5,
        "sql": "SELECT table_name, table_type FROM information_schema.tables LIMIT 5"
    }
]

for query in test_queries:
    url = f"{BASE_URL}/api/v1/dbs/{DB_NAME}/export"
    filename = f"test_export_{query['format']}.{query['format']}"
    
    print(f"Testing {query['format']} export...")
    response = requests.post(url, json=query, stream=True)
    
    if response.status_code == 200:
        with open(filename, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        print(f"✅ Successfully exported to {filename}")
    else:
        print(f"❌ Export failed: {response.status_code} - {response.text}")
```

## 环境检查清单

在启动前，确保以下环境配置正确：

- [ ] Python 3.12+ 已安装
- [ ] Node.js 和 npm 已安装  
- [ ] 后端依赖已安装（fastapi, uvicorn, sqlmodel, pandas, openpyxl等）
- [ ] 前端依赖已安装（antd, axios, react等）
- [ ] 数据库连接字符串配置正确
- [ ] 端口8000和5173没有被其他应用占用

## 下一步

启动成功后：

1. 访问前端界面 http://localhost:5173
2. 创建或选择数据库连接
3. 执行一些测试查询
4. 测试导出功能
5. 验证下载的文件内容是否正确

需要帮助调试时，查看浏览器控制台（F12）和后端终端输出的错误信息。