import numpy as np
from scipy.signal import find_peaks

def calculate_rmssd(ecg_window, sampling_rate=700):
    """
    Calculates RMSSD (Heart Rate Variability biomarker) from raw ECG.
    """
    # Normalize the ECG signal
    ecg_normalized = (ecg_window - np.mean(ecg_window)) / (np.std(ecg_window) + 1e-8)
    
    # Find the R-peaks (Heartbeat spikes)
    peaks, _ = find_peaks(ecg_normalized, height=0.5, distance=int(sampling_rate * 0.4))
    
    if len(peaks) < 2:
        return 0.0 # Not enough beats detected in this window
        
    # Calculate RR intervals in milliseconds
    rr_intervals = np.diff(peaks) / sampling_rate * 1000 
    
    # Calculate successive differences
    successive_differences = np.diff(rr_intervals)
    
    # RMSSD Formula
    squared_diffs = successive_differences ** 2
    rmssd = np.sqrt(np.mean(squared_diffs))
    
    return rmssd