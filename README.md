# 🚀 EVA Digital Twin: Real-Time Aerospace Health Monitoring

![UI Preview](https://img.shields.io/badge/UI-React_%7C_Vite_%7C_Three.js-blue)
![Backend](https://img.shields.io/badge/Backend-FastAPI_%7C_WebSockets-009688)
![AI Core](https://img.shields.io/badge/AI_Core-PyTorch_%7C_LSTM_%7C_Temporal_Attention-EE4C2C)

## 📋 Overview
During Extravehicular Activities (EVAs) or high-stress operational tasks, an astronaut's cognitive load can spike dangerously before they consciously realize they are fatigued. The **EVA Digital Twin** is an edge-computing Artificial Intelligence architecture designed to predict cognitive fatigue *before* it causes a critical failure. 

By streaming real-time physiological telemetry into a localized Spatio-Temporal deep learning model, this system acts as a live digital replica of the astronaut's central nervous system. It provides Mission Control with zero-latency threat detection and mathematically sound Explainable AI (XAI) feature in LSTM diagnostics, ensuring the safety of human spaceflight.

## ✨ Key Features
* **Live Telemetry Stream:** Zero-latency WebSocket connection streaming 4-dimensional biological data (ECG, Respiration, Skin Temperature, and Electrodermal Activity).
* **Deep Storage Architecture:** A rolling 3-minute frontend RAM buffer paired with a FastAPI REST endpoint that allows engineers to query historical "Deep Storage" timestamps without interrupting the live stream.
* **Intrinsic Explainable AI (XAI) inside LSTM:** Replaces computationally heavy Post-Hoc XAI (like SHAP) with a native **Temporal Attention Mechanism**. This generates live focus weights, revealing exactly which biological micro-events (e.g., sudden sweat gland activation) are driving the AI's cognitive load predictions.
* **Aerospace-Grade Robustness:** The training pipeline incorporates controlled Gaussian noise injection and biological smoothing filters to simulate and overcome real-world aerospace sensor artifacts.

## 🧠 The AI Architecture (PyTorch)
The predictive core is built on a custom **Spatio-Temporal Long Short-Term Memory (LSTM)** network augmented with a Temporal Attention Layer, trained on the WESAD (Wearable Stress and Affect Detection) dataset.

* **Inputs:** 30-second temporal windows of raw, highly downsampled biometric data, aggregated and standardized for real-time edge computing.
* **Biomarkers:** Electrocardiogram (ECG), Impedance Pneumography (Resp), Thermistor Data (Temp), and Electrodermal Activity (EDA/Galvanic Skin Response).
* **Validation:** The model was rigorously validated using a strict **Leave-One-Subject-Out Cross-Validation (LOSO-CV)** protocol. The AI was forced to predict cognitive fatigue on an entirely unseen subject, proving it learns universal physiological stress signatures rather than memorizing individual data.
* **Performance:** Achieved a scientifically defensible generalization accuracy of **~89.97%**, proving high reliability without overfitting.

## 🛠️ Technology Stack
**Mission Control Dashboard (Frontend)**
* React.js & Vite (Lightning-fast HMR and optimized build)
* Recharts (High-performance SVG charting for continuous biometrics)
* Three.js & React Three Fiber (Procedural 3D UI rendering)
* Tailwind CSS / Custom Inline Styling

**Deep Learning Server (Backend)**
* FastAPI (High-performance async Python edge server)
* WebSockets (Bi-directional, continuous data streaming)
* PyTorch (Deep learning tensor operations and Attention inference)
* Pandas & NumPy (High-frequency signal processing and scaling)

## 🚀 Installation & Local Deployment

### 📥 Download Mission Data & AI Weights
Because aerospace telemetry and deep learning weights exceed GitHub's file size limits, the data is hosted securely in the cloud. Before booting the server, please download the following files and place them in the root directory:
* [Download attention_model.pth (Weights) Here](https://drive.google.com/file/d/1LazrWzEGQ7Mkb7_Hy-jVzuvywSbRjfFV/view?usp=sharing)
* [Download real_mission_data_4D.pkl (Telemetry) Here](https://drive.google.com/file/d/17v2vvrQtoK2lG8SefOyzoIVgx7mZNPwU/view?usp=sharing)

### 1. Boot the Deep Learning Backend
Navigate to the root directory, activate your virtual environment, and install dependencies:
```bash
pip install fastapi "uvicorn[standard]" websockets torch numpy scipy scikit-learn
```

Start the Mission Control server:
```bash
python server.py
```
*The server will boot the PyTorch weights and initialize the WebSocket stream on `ws://127.0.0.1:8000`.*

### 2. Boot the Mission Control Dashboard
Open a new terminal window, navigate to the frontend directory, and start the React app:
```bash
cd frontend
npm install
npm run dev
```
*Navigate to `http://localhost:5173/` in your browser to view the live dashboard.*

---
*Developed as an independent research initiative in aerospace biomedical engineering.*