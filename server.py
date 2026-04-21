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
# PHASE 2: THE ATTENTION ARCHITECTURE
# ==========================================
class AttentionFatigueModel(nn.Module):
    def __init__(self, input_size=4, hidden_size=64, num_layers=2):
        super(AttentionFatigueModel, self).__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True, dropout=0.2)
        self.attention_layer = nn.Linear(hidden_size, 1)
        self.fc = nn.Linear(hidden_size, 1)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        lstm_out, _ = self.lstm(x) 
        attn_weights = self.attention_layer(lstm_out)
        attn_weights = torch.softmax(attn_weights, dim=1) 
        context_vector = torch.sum(attn_weights * lstm_out, dim=1)
        prediction = self.sigmoid(self.fc(context_vector))
        return prediction, attn_weights.squeeze(-1)

# ==========================================
# LOAD FLIGHT-READY RESOURCES
# ==========================================
print("Booting Deep Learning Attention Core...")
model = AttentionFatigueModel()
model.load_state_dict(torch.load('attention_model.pth', weights_only=True))
model.eval()

print("Loading 4D Mission Database (mission_db_v2.pkl)...")
with open('mission_db_v2.pkl', 'rb') as f:
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
    
    # The server processes data in 30-second windows. 
    # We find the exact window that contains the requested second.
    window_idx = time_sec // 30
    
    if window_idx >= len(telemetry):
        return {"status": "error", "message": f"T+ {time_sec}s exceeds mission database length."}
        
    # Extract the true mathematical data from that exact window
    ecg, resp, temp, hrv = telemetry[window_idx]
    
    return {
        "status": "found",
        "data": {
            "second": time_sec,
            "ecg": float(ecg),
            "resp": float(resp),
            "temp": float(temp),
            "hrv": float(hrv)
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
    
    # i represents the current time step (each row is a 30-sec window)
    i = 0 
    
    try:
        while True:
            # Loop the simulation if we run out of data
            if i >= len(telemetry):
                i = 0 
                
            # 1. Extract the 4 variables from the current frame
            ecg, resp, temp, hrv = telemetry[i]
            actual_state = ground_truth[i]
            
            # --- LIVE AI INFERENCE ---
            # We feed the last 5 sequences into the model
            if i >= 5:
                window_data = telemetry[i-5:i]
                tensor_data = torch.tensor(window_data, dtype=torch.float32).unsqueeze(0)
                
                with torch.no_grad():
                    prediction, attention = model(tensor_data)
                    fatigue_prob = float(prediction.item())
                    
                    # TRUE XAI: How much the AI is focusing on this exact moment (0.0 to 1.0)
                    current_attention = float(attention[0][-1].item()) 
            else:
                fatigue_prob = 0.0
                current_attention = 0.0

            # 2. Server-Side XAI Integration for the React Charts
            # We scale the biological deviations by the AI's actual attention weight!
            xai_impacts = {
                "ecg": float(abs(ecg) * current_attention),
                "resp": float(abs(resp) * current_attention),
                "temp": float(abs(temp) * current_attention),
                "hrv": float(abs(hrv) * current_attention)
            }

            # 3. Format the data for the React charts
            current_time_sec = i * 30 # Convert sequence step to mission seconds
            latest_second_data = [{
                "second": current_time_sec,
                "ecg": float(ecg),
                "resp": float(resp),
                "temp": float(temp),
                "hrv": float(hrv)
            }]

            # Send payload to React instantly
            payload = {
                "time_sec": current_time_sec,
                "ai_fatigue_index": fatigue_prob,
                "is_actually_fatigued": bool(actual_state),
                "xai_impacts": xai_impacts,
                "new_data": latest_second_data,
                "attention_weight": current_attention
            }
            
            await websocket.send_json(payload)
            
            # Move forward one sequence step and wait 1 second (Live Simulation)
            i += 1
            await asyncio.sleep(1)
            
    except WebSocketDisconnect:
        print(f"Mission Control disconnected from {subject} stream.")

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)