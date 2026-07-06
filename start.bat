@echo off
echo ===================================================
echo   ARIA: Autonomous Research Agent - System Check
echo ===================================================

echo [1/5] Checking Docker daemon status...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [CRITICAL ERROR] Docker Desktop is not running.
    echo Please launch Docker Desktop from your Start menu, wait for the engine to load, and try again.
    echo.
    pause
    exit /b
)

echo [2/5] Validating Environment Variables...
if not exist "backend\.env" (
    echo # ARIA Environment Variables > backend\.env
    echo HF_TOKEN=your_huggingface_or_openrouter_token_here >> backend\.env
    echo TAVILY_API_KEY=your_tavily_key_here >> backend\.env
    echo GOOGLE_API_KEY=your_gcp_api_key_here >> backend\.env
    echo GOOGLE_CX_ID=your_search_engine_id_here >> backend\.env
    
    echo.
    echo [ACTION REQUIRED] A new .env template has been generated.
    echo Navigate to the /backend folder, open the .env file, insert your API keys, 
    echo and then run this start script again.
    echo.
    pause
    exit /b
)

echo [3/5] Docker is online. Booting SearXNG Metasearch Engine...
docker-compose up -d

echo [4/5] Resolving Backend Dependencies via uv...
cd backend
if not exist ".venv" (
    uv venv
)
call .venv\Scripts\activate
uv pip install -r requirements.txt
start "ARIA Backend" cmd /k "uvicorn main:app --reload --port 8000"

echo [5/5] Resolving Frontend Dependencies...
cd ../frontend
call npm install
start "ARIA Frontend" cmd /k "npm run dev"

echo.
echo ===================================================
echo   SYSTEM ONLINE: ARIA is ready.
echo ===================================================