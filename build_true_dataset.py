import os
import pickle
import numpy as np
from hrv_extractor import calculate_rmssd

# Subjects you want to process
subjects = ['S2', 'S3', 'S4', 'S5', 'S6'] 

# IMPORTANT: Change this path to where your actual WESAD raw folders are
wesad_path = './WESAD' 

mission_db_v2 = {}
window_size_sec = 30
hz_raw = 700
window_frames = window_size_sec * hz_raw

print("🚀 Initiating True HRV Data Extraction Pipeline...")

for subject in subjects:
    file_path = os.path.join(wesad_path, subject, f'{subject}.pkl')
    
    if not os.path.exists(file_path):
        print(f"⚠️ Could not find raw data for {subject} at {file_path}. Skipping.")
        continue
        
    print(f"Loading massive raw file for {subject}...")
    with open(file_path, 'rb') as f:
        data = pickle.load(f, encoding='latin1')
        
    raw_ecg = data['signal']['chest']['ECG'].flatten()
    raw_resp = data['signal']['chest']['Resp'].flatten()
    raw_temp = data['signal']['chest']['Temp'].flatten()
    labels = data['label'].flatten()
    
    # We only care about Baseline (1) and Stress (2) for this model
    valid_indices = np.where((labels == 1) | (labels == 2))[0]
    
    if len(valid_indices) == 0:
        continue
        
    start_idx = valid_indices[0]
    end_idx = valid_indices[-1]
    
    telemetry = []
    ground_truth = []
    
    print(f"⚙️ Crunching 700Hz data into 30-second windows for {subject}...")
    
    # Slide through the data in 30-second chunks
    for i in range(start_idx, end_idx, window_frames):
        window_label = labels[i:i + window_frames]
        
        # Only process if the whole window is the same state
        if len(set(window_label)) != 1:
            continue
            
        state = window_label[0]
        if state not in [1, 2]:
            continue
            
        ecg_window = raw_ecg[i:i + window_frames]
        resp_window = raw_resp[i:i + window_frames]
        temp_window = raw_temp[i:i + window_frames]
        
        if len(ecg_window) < window_frames:
            break
            
        # 1. Calculate TRUE Mathematical HRV (RMSSD)
        hrv_value = calculate_rmssd(ecg_window, sampling_rate=hz_raw)
        
        # 2. Get the mean of the other values to match our earlier architecture
        mean_ecg = np.mean(ecg_window)
        mean_resp = np.mean(resp_window)
        mean_temp = np.mean(temp_window)
        
        # Format: [ECG, RESP, TEMP, HRV]
        telemetry.append([mean_ecg, mean_resp, mean_temp, hrv_value])
        
        # Map labels: Baseline(1)->0, Stress(2)->1
        ground_truth.append(0 if state == 1 else 1)
        
    # Standardize the data (Z-score) just like we did before
    telemetry = np.array(telemetry)
    for col in range(4):
        std_val = np.std(telemetry[:, col])
        if std_val > 0:
            telemetry[:, col] = (telemetry[:, col] - np.mean(telemetry[:, col])) / std_val
            
    mission_db_v2[subject] = {
        'telemetry': telemetry,
        'ground_truth': np.array(ground_truth)
    }
    
    print(f"✅ Completed {subject}: Extracted {len(telemetry)} clean, 4-dimensional windows.\n")

# Save the ultimate database
with open('mission_db_v2.pkl', 'wb') as f:
    pickle.dump(mission_db_v2, f)
    
print("🎯 ARCHIVE UPGRADE COMPLETE. Saved as 'mission_db_v2.pkl'. Ready for Phase 2!")