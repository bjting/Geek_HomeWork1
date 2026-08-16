#!/bin/bash
# 启动脚本 - 同时启动前后端服务器

echo "========================================"
echo "Database Query Tool - 启动脚本"
echo "========================================"
echo

echo "[1/4] 检查环境..."
python --version
node --version
npm --version
echo

echo "[2/4] 检查后端依赖..."
cd backend
python -c "import fastapi, uvicorn, sqlmodel, pandas, openpyxl" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "正在安装后端依赖..."
    pip install fastapi uvicorn sqlmodel pandas openpyxl asyncpg aiomysql PyMySQL python-dotenv
fi
echo "后端依赖检查完成"
cd ..
echo

echo "[3/4] 检查前端依赖..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "正在安装前端依赖..."
    npm install
fi
echo "前端依赖检查完成"
cd ..
echo

echo "[4/4] 启动服务器..."
echo "后端服务器将在 http://localhost:8000 启动"
echo "前端服务器将在 http://localhost:5173 启动"
echo
echo "按 Ctrl+C 停止所有服务器"
echo "========================================"
echo

# 启动后端（后台运行）
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 3

# 启动前端（后台运行）
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo
echo "========================================"
echo "服务器已启动!"
echo "请访问:"
echo "- 前端: http://localhost:5173"
echo "- 后端API: http://localhost:8000"
echo "- API文档: http://localhost:8000/docs"
echo "========================================"
echo

# 等待任意键退出
read -p "按任意键停止服务器..."

# 停止服务器
kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
echo "服务器已停止"