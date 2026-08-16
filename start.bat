@echo off
REM 启动脚本 - 同时启动前后端服务器

echo ========================================
echo Database Query Tool - 启动脚本
echo ========================================
echo.

echo [1/4] 检查环境...
python --version
node --version
npm --version
echo.

echo [2/4] 检查后端依赖...
cd backend
python -c "import fastapi, uvicorn, sqlmodel, pandas, openpyxl" 2>nul
if errorlevel 1 (
    echo 正在安装后端依赖...
    pip install fastapi uvicorn sqlmodel pandas openpyxl asyncpg aiomysql PyMySQL python-dotenv
)
echo 后端依赖检查完成
cd ..
echo.

echo [3/4] 检查前端依赖...
cd frontend
if not exist "node_modules" (
    echo 正在安装前端依赖...
    call npm install
)
echo 前端依赖检查完成
cd ..
echo.

echo [4/4] 启动服务器...
echo 后端服务器将在 http://localhost:8000 启动
echo 前端服务器将在 http://localhost:5173 启动
echo.
echo 按 Ctrl+C 停止所有服务器
echo ========================================
echo.

REM 启动后端
start "Backend Server" cmd /k "cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

REM 等待后端启动
timeout /t 3 /nobreak > nul

REM 启动前端
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo 服务器正在启动中...
echo 请稍等几秒钟后访问:
echo - 前端: http://localhost:5173
echo - 后端API: http://localhost:8000
echo - API文档: http://localhost:8000/docs
echo ========================================
pause