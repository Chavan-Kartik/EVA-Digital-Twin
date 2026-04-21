import pickle
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim

# ==========================================
# PHASE 2: THE ATTENTION ARCHITECTURE
# ==========================================
class AttentionFatigueModel(nn.Module):
    def __init__(self, input_size=4, hidden_size=64, num_layers=2):
        super(AttentionFatigueModel, self).__init__()
        # Input size is now 4 [ECG, RESP, TEMP, HRV]
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True, dropout=0.2)
        
        # The Temporal Attention Layer
        self.attention_layer = nn.Linear(hidden_size, 1)
        self.fc = nn.Linear(hidden_size, 1)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        # x shape: (batch, seq_len, features)
        lstm_out, _ = self.lstm(x) 
        
        # Calculate attention weights for each time step
        attn_weights = self.attention_layer(lstm_out)
        attn_weights = torch.softmax(attn_weights, dim=1) 
        
        # Multiply LSTM memory by attention weights
        context_vector = torch.sum(attn_weights * lstm_out, dim=1)
        
        prediction = self.sigmoid(self.fc(context_vector))
        return prediction, attn_weights.squeeze(-1)

# ==========================================
# HELPER: SEQUENCE GENERATOR
# ==========================================
def create_sequences(data, labels, seq_length=5):
    """
    Groups the 30-second windows into sequences.
    A seq_length of 5 means the AI looks at the past 2.5 minutes of telemetry
    to predict the astronaut's CURRENT cognitive state.
    """
    xs, ys = [], []
    for i in range(len(data) - seq_length):
        xs.append(data[i:(i + seq_length)])
        ys.append(labels[i + seq_length - 1])
    return np.array(xs), np.array(ys)

# ==========================================
# PHASE 3: LEAVE-ONE-SUBJECT-OUT (LOSO) CV
# ==========================================
if __name__ == "__main__":
    print("Loading 4D Mission Database...")
    with open('mission_db_v2.pkl', 'rb') as f:
        mission_db = pickle.load(f)

    subjects = list(mission_db.keys())
    seq_length = 5
    epochs = 50
    
    print("\n🚀 Initiating Leave-One-Subject-Out (LOSO) Cross-Validation...\n")
    
    fold_accuracies = []

    # The Research Loop: Train on N-1 subjects, test on 1 totally unseen subject
    for test_subject in subjects:
        print(f"--- FOLD: Testing on unseen subject {test_subject} ---")
        
        # 1. Split Data
        train_x, train_y = [], []
        for sub in subjects:
            if sub != test_subject:
                x_seq, y_seq = create_sequences(mission_db[sub]['telemetry'], mission_db[sub]['ground_truth'], seq_length)
                train_x.append(x_seq)
                train_y.append(y_seq)
                
        train_x = np.vstack(train_x)
        train_y = np.concatenate(train_y)
        
        test_x, test_y = create_sequences(mission_db[test_subject]['telemetry'], mission_db[test_subject]['ground_truth'], seq_length)
        
        # Convert to PyTorch Tensors
        X_train_t = torch.tensor(train_x, dtype=torch.float32)
        y_train_t = torch.tensor(train_y, dtype=torch.float32).unsqueeze(1)
        X_test_t = torch.tensor(test_x, dtype=torch.float32)
        y_test_t = torch.tensor(test_y, dtype=torch.float32).unsqueeze(1)
        
        # 2. Initialize Model
        model = AttentionFatigueModel()
        criterion = nn.BCELoss()
        optimizer = optim.Adam(model.parameters(), lr=0.001)
        
        # 3. Train Model
        model.train()
        for epoch in range(epochs):
            optimizer.zero_grad()
            predictions, _ = model(X_train_t)
            loss = criterion(predictions, y_train_t)
            loss.backward()
            optimizer.step()
            
        # 4. Evaluate Model on the Unseen Astronaut
        model.eval()
        with torch.no_grad():
            test_preds, _ = model(X_test_t)
            test_preds_binary = (test_preds >= 0.5).float()
            correct = (test_preds_binary == y_test_t).sum().item()
            accuracy = (correct / len(y_test_t)) * 100
            
        fold_accuracies.append(accuracy)
        print(f"✅ Accuracy on Unseen {test_subject}: {accuracy:.2f}%\n")

    # ==========================================
    # FINAL EXPORT
    # ==========================================
    mean_acc = np.mean(fold_accuracies)
    print("==================================================")
    print(f"🎯 LOSO CROSS-VALIDATION COMPLETE")
    print(f"🎯 AVERAGE GENERALIZATION ACCURACY: {mean_acc:.2f}%")
    print("==================================================\n")
    
    print("Retraining final model on ALL subjects for live deployment...")
    
    # Train one final time on all available data for the live server
    all_x, all_y = [], []
    for sub in subjects:
        x_seq, y_seq = create_sequences(mission_db[sub]['telemetry'], mission_db[sub]['ground_truth'], seq_length)
        all_x.append(x_seq)
        all_y.append(y_seq)
        
    X_all_t = torch.tensor(np.vstack(all_x), dtype=torch.float32)
    y_all_t = torch.tensor(np.concatenate(all_y), dtype=torch.float32).unsqueeze(1)
    
    final_model = AttentionFatigueModel()
    optimizer = optim.Adam(final_model.parameters(), lr=0.001)
    final_model.train()
    
    for epoch in range(epochs):
        optimizer.zero_grad()
        preds, _ = final_model(X_all_t)
        loss = criterion(preds, y_all_t)
        loss.backward()
        optimizer.step()
        
    # Save the flight-ready weights
    torch.save(final_model.state_dict(), 'attention_model.pth')
    print("🚀 FLIGHT-READY WEIGHTS SAVED AS 'attention_model.pth'")