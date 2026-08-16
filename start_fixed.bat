@echo off
REM 修复后的启动脚本

echo ========================================
echo Database Query Tool - 启动脚本 (修复版)
echo ========================================
echo.

echo [1/4] 创建环境配置文件...
if not exist "backend\.env" (
    echo OPENAI_API_KEY=your_openai_api_key_here > backend\.env
    echo ✅ 创建了 backend\.env 文件
) else (
    echo ✅ backend\.env 文件已存在
)
echo.

echo [2/4] 检查端口占用...
netstat -ano | findstr :8000 >nul
if %errorlevel% == 0 (
    echo ⚠️  端口8000被占用，将使用8001
) else (
    echo ✅ 端口8000可用
)

netstat -ano | findstr :5173 >nul
if %errorlevel% == 0 (
    echo ⚠️  端口5173被占用，将使用5174
) else (
    echo ✅ 端口5173可用
)
echo.

echo [3/4] 检查依赖...
cd backend
python -c "import fastapi, uvicorn, sqlmodel, pandas, openpyxl" 2>nul
if errorlevel 1 (
    echo 正在安装后端依赖...
    pip install fastapi uvicorn sqlmodel pandas openpyxl asyncpg aiomysql PyMySQL python-dotenv
) else (
    echo ✅ 后端依赖检查完成
)
cd ..

cd frontend
if not exist "node_modules" (
    echo 正在安装前端依赖...
    call npm install
) else (
    echo ✅ 前端依赖检查完成
)
cd ..
echo.

echo [4/4] 启动服务器...
echo 🌐 后端服务器将启动在: http://localhost:8001
echo 🌐 前端服务器将启动在: http://localhost:5174 (或5173)
echo.
echo 按 Ctrl+C 停止所有服务器
echo ========================================
echo.

REM 停止可能存在的进程
taskkill //F //IM python.exe 2>nul
taskkill //F //IM node.exe 2>nul

REM 等待进程停止
timeout /t 2 /nobreak > nul

REM 启动后端
start "Backend Server" cmd /k "cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8001"

REM 等待后端启动
timeout /t 3 /nobreak > nul

REM 启动前端
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo 服务器正在启动中...
echo 请稍等几秒钟后访问:
echo - 前端: http://localhost:5174 (或检查终端显示的实际端口)
echo - 后端API: http://localhost:8001
echo - API文档: http://localhost:8001/docs
echo ========================================
echo.
echo 📝 提示: 请在 backend/.env 中配置你的 OPENAI_API_KEY
pause