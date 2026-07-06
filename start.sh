#!/bin/bash
echo "==================================================="
echo "  ARIA: Autonomous Research Agent - System Check"
echo "==================================================="

echo "[1/5] Checking Docker daemon status..."
if ! docker info > /dev/null 2>&1; then
  echo -e "\n[CRITICAL ERROR] Docker is not running."
  echo -e "Please launch Docker Desktop or start the docker daemon and try again.\n"
  exit 1
fi

echo "[2/5] Validating Environment Variables..."
if [ ! -f "backend/.env" ]; then
    echo "# ARIA Environment Variables" > backend/.env
    echo "HF_TOKEN=your_huggingface_or_openrouter_token_here" >> backend/.env
    echo "TAVILY_API_KEY=your_tavily_key_here" >> backend/.env
    echo "GOOGLE_API_KEY=your_gcp_api_key_here" >> backend/.env
    echo "GOOGLE_CX_ID=your_search_engine_id_here" >> backend/.env
    
    echo -e "\n[ACTION REQUIRED] A new .env template has been generated."
    echo -e "Navigate to the /backend folder, open the .env file, insert your API keys,"
    echo -e "and then run this start script again.\n"
    exit 1
fi

echo "[3/5] Docker is online. Booting SearXNG Metasearch Engine..."
docker-compose up -d

echo "[4/5] Resolving Backend Dependencies via uv..."
cd backend || exit
if [ ! -d ".venv" ]; then
    uv venv
fi
source .venv/bin/activate
uv pip install -r requirements.txt
# Launch FastAPI in the background
nohup uvicorn main:app --reload --port 8000 > backend.log 2>&1 &

echo "[5/5] Resolving Frontend Dependencies..."
cd ../frontend || exit
npm install
# Launch React in the background
nohup npm run dev > frontend.log 2>&1 &

echo -e "\n==================================================="
echo "  SYSTEM ONLINE: ARIA is ready."
echo "  Backend: http://localhost:8000"
echo "  Frontend: http://localhost:5173"
echo "==================================================="