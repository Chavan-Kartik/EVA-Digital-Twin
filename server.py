from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import torch
import torch.nn as nn
import pickle
import numpy as np
import uvicorn
import asyncio

app = FastAPI(title="Astronaut Digital Twin Streaming API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# PHASE 2: THE 4D ATTENTION ARCHITECTURE
# ==========================================
class AttentionLSTM(nn.Module):
    def __init__(self, input_dim=4, hidden_dim=64, num_layers=2): # 4 DIMENSIONS
        super(AttentionLSTM, self).__init__()
        self.lstm = nn.LSTM(input_dim, hidden_dim, num_layers, batch_first=True, dropout=0.3)
        self.attention_weights = nn.Linear(hidden_dim, 1)
        self.fc = nn.Linear(hidden_dim, 1)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        lstm_out, _ = self.lstm(x)
        attention_scores = torch.tanh(self.attention_weights(lstm_out))
        attention_dist = torch.softmax(attention_scores, dim=1)
        context_vector = torch.sum(attention_dist * lstm_out, dim=1)
        prediction = self.sigmoid(self.fc(context_vector))
        return prediction, attention_dist

# ==========================================
# LOAD FLIGHT-READY RESOURCES
# ==========================================
print("Booting 4D Deep Learning Attention Core...")
model = AttentionLSTM()
model.load_state_dict(torch.load('attention_model.pth', weights_only=True))
model.eval()

print("Loading 4D Mission Database (real_mission_data_4D.pkl)...")
with open('real_mission_data_4D.pkl', 'rb') as f:
    mission_db = pickle.load(f)

print("✅ WebSockets Online. Awaiting Mission Control connection.")

@app.get("/api/crew")
def get_crew():
    return {"crew_members": list(mission_db.keys())}

@app.get("/api/query/{subject}/{time_sec}")
def query_deep_history(subject: str, time_sec: int):
    if subject not in mission_db:
        return {"status": "error", "message": "Astronaut not found"}
        
    telemetry = mission_db[subject]['telemetry']
    window_idx = time_sec // 30
    
    if window_idx >= len(telemetry):
        return {"status": "error", "message": f"T+ {time_sec}s exceeds mission database length."}
        
    # Extract the true mathematical data (Now with EDA)
    ecg, resp, temp, eda = telemetry[window_idx]
    
    return {
        "status": "found",
        "data": {
            "second": time_sec,
            "ecg": float(ecg),
            "resp": float(resp),
            "temp": float(temp),
            "hrv": float(eda) # Updated to EDA
        }
    }

# ==========================================
# THE WEBSOCKET STREAMING ENGINE
# ==========================================
@app.websocket("/ws/stream/{subject}")
async def telemetry_stream(websocket: WebSocket, subject: str):
    await websocket.accept()
    
    if subject not in mission_db:
        await websocket.close(code=1008, reason="Astronaut not found")
        return

    telemetry = mission_db[subject]['telemetry']
    ground_truth = mission_db[subject]['ground_truth']
    
    i = 0 
    
    try:
        while True:
            if i >= len(telemetry):
                i = 0 
                
            # 1. Extract the 4 variables (Now with EDA)
            ecg, resp, temp, eda = telemetry[i]
            actual_state = ground_truth[i]
            
            # --- LIVE 4D AI INFERENCE ---
            if i >= 5:
                window_data = telemetry[i-5:i]
                tensor_data = torch.tensor(window_data, dtype=torch.float32).unsqueeze(0)
                
                with torch.no_grad():
                    prediction, attention = model(tensor_data)
                    fatigue_prob = float(prediction.item())
                    current_attention = float(attention[0][-1].item()) 
            else:
                fatigue_prob = 0.0
                current_attention = 0.0

            # 2. Server-Side XAI Integration
            xai_impacts = {
                "ecg": float(abs(ecg) * current_attention),
                "resp": float(abs(resp) * current_attention),
                "temp": float(abs(temp) * current_attention),
                "hrv": float(abs(eda) * current_attention) # Updated to EDA
            }

            # 3. Format the data for React
            current_time_sec = i * 30 
            latest_second_data = [{
                "second": current_time_sec,
                "ecg": float(ecg),
                "resp": float(resp),
                "temp": float(temp),
                "hrv": float(eda) # Updated to EDA
            }]

            payload = {
                "time_sec": current_time_sec,
                "ai_fatigue_index": fatigue_prob,
                "is_actually_fatigued": bool(actual_state),
                "xai_impacts": xai_impacts,
                "new_data": latest_second_data,
                "attention_weight": current_attention
            }
            
            await websocket.send_json(payload)
            i += 1
            await asyncio.sleep(1)
            
    except WebSocketDisconnect:
        print(f"Mission Control disconnected from {subject} stream.")

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)