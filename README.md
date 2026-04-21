# 🚀 EVA Digital Twin: Real-Time Aerospace Health Monitoring

![UI Preview](https://img.shields.io/badge/UI-React_%7C_Vite_%7C_Three.js-blue)
![Backend](https://img.shields.io/badge/Backend-FastAPI_%7C_WebSockets-009688)
![AI Core](https://img.shields.io/badge/AI_Core-PyTorch_%7C_LSTM_%7C_Temporal_Attention-EE4C2C)

## 📋 Overview
During Extravehicular Activities (EVAs) or high-stress operational tasks, an astronaut's cognitive load can spike dangerously before they consciously realize they are fatigued. The **EVA Digital Twin** is an edge-computing Artificial Intelligence architecture designed to predict cognitive fatigue *before* it causes a critical failure. 

By streaming real-time physiological telemetry into a localized Spatio-Temporal deep learning model, this system acts as a live digital replica of the astronaut's central nervous system, providing Mission Control with zero-latency threat detection and Explainable AI (XAI) diagnostics.

## ✨ Key Features
* **Live Telemetry Stream:** Zero-latency WebSocket connection streaming 4-dimensional biological data (ECG, Respiration, Skin Temp, and HRV).
* **Deep Storage Architecture:** A rolling 3-minute frontend RAM buffer paired with a FastAPI REST endpoint that allows engineers to query historical "Deep Storage" timestamps without interrupting the live stream.
* **True Explainable AI (XAI):** Replaces computationally heavy SHAP algorithms with a native **Temporal Attention Mechanism**, rendering a live Radar Chart that reveals exactly which biological anomalies are driving the AI's predictions.
* **Dual-Stream Data Pipeline:** Separates highly-optimized, Z-scored inference data (for the PyTorch tensor) from mathematically normalized telemetry (for Mission Control UI visibility).

## 🧠 The AI Architecture (PyTorch)
The predictive core is built on a custom **Spatio-Temporal Long Short-Term Memory (LSTM)** network augmented with a Temporal Attention Layer.

* **Inputs:** 30-second windows of raw 700Hz biometric data, aggregated and standardized.
* **Biomarkers:** Electrocardiogram (ECG), Impedance Pneumography (Resp), Thermistor Data (Temp), and Root Mean Square of Successive Differences (RMSSD/HRV).
* **Validation:** The model was rigorously validated using **Leave-One-Subject-Out Cross-Validation (LOSO-CV)** to ensure it learns universal physiological stress signatures rather than overfitting to specific individuals.
* **Performance:** Generalization accuracy of **~84.3%** on entirely unseen subjects.

## 🛠️ Technology Stack
**Mission Control Dashboard (Frontend)**
* React.js & Vite (Lightning-fast HMR and optimized build)
* Recharts (High-performance SVG charting for biometrics)
* Three.js & React Three Fiber (Procedural 3D startup rendering)
* Tailwind CSS / Custom Inline Styling

**Deep Learning Server (Backend)**
* FastAPI (High-performance async Python server)
* WebSockets (Bi-directional, continuous data streaming)
* PyTorch (Deep learning tensor operations and Attention inference)
* Pandas & NumPy (High-frequency signal processing)

## 🚀 Installation & Local Deployment

### 1. Boot the Deep Learning Backend
Navigate to the root directory, activate your virtual environment, and install dependencies:
```bash
pip install fastapi "uvicorn[standard]" websockets torch numpy scipy

Start the Mission Control server:
python server.py

The server will boot the PyTorch weights and initialize the WebSocket stream on 
ws://127.0.0.1:8000.

2. Boot the Mission Control Dashboard
Open a new terminal window, navigate to the frontend directory, and start the React app:
cd frontend
npm install
npm run dev

Navigate to http://localhost:5173/ in your browser to view the live dashboard.

Developed as an independent research initiative in aerospace biomedical engineering