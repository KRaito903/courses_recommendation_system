// src/pages/admin/AdminModel.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import './AdminModel.css';

const AdminModel = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [modelInfo, setModelInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [training, setTraining] = useState(false);
    const [trainingProgress, setTrainingProgress] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Training configuration
    const [config, setConfig] = useState({
        modelType: 'lightgcn',
        epochs: 100,
        learningRate: 0.001,
        batchSize: 1024,
        embeddingSize: 64
    });

    useEffect(() => {
        if (!currentUser) {
            navigate('/auth');
            return;
        }
        fetchModelInfo();
    }, [currentUser]);

    const fetchModelInfo = async () => {
        try {
            setLoading(true);
            const token = await currentUser.getIdToken();
            
            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/model/info`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch model info');
            }

            const data = await response.json();
            setModelInfo(data);
        } catch (err) {
            console.error('Error fetching model info:', err);
            setError(err.message || 'Failed to fetch model info');
        } finally {
            setLoading(false);
        }
    };

    const handleTrainModel = async () => {
        if (!window.confirm('Bạn có chắc chắn muốn train model mới? Quá trình này có thể mất vài phút.')) {
            return;
        }

        try {
            setTraining(true);
            setError('');
            setSuccess('');
            setTrainingProgress({ status: 'starting', epoch: 0 });

            const token = await currentUser.getIdToken();
            
            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/model/train`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(config)
            });

            if (!response.ok) {
                throw new Error('Failed to start training');
            }

            const data = await response.json();
            
            // Poll for training status
            pollTrainingStatus(data.trainingId);
        } catch (err) {
            console.error('Error training model:', err);
            setError(err.message || 'Failed to train model');
            setTraining(false);
        }
    };

    const pollTrainingStatus = async (trainingId) => {
        const interval = setInterval(async () => {
            try {
                const token = await currentUser.getIdToken();
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/admin/model/training-status/${trainingId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch training status');
                }

                const data = await response.json();
                setTrainingProgress(data);

                if (data.status === 'completed') {
                    clearInterval(interval);
                    setTraining(false);
                    setSuccess('✅ Model trained successfully!');
                    fetchModelInfo();
                } else if (data.status === 'failed') {
                    clearInterval(interval);
                    setTraining(false);
                    setError('❌ Training failed: ' + (data.error || 'Unknown error'));
                }
            } catch (err) {
                console.error('Error polling training status:', err);
                clearInterval(interval);
                setTraining(false);
                setError('Failed to get training status');
            }
        }, 2000); // Poll every 2 seconds
    };

    if (loading) {
        return (
            <div className="admin-container">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <div className="admin-header">
                <div>
                    <button 
                        className="back-btn"
                        onClick={() => navigate('/admin')}
                    >
                        ← Quay lại Dashboard
                    </button>
                    <h1>🤖 Quản Lý Model</h1>
                    <p>Train và quản lý AI recommendation model</p>
                </div>
            </div>

            {error && (
                <div className="error-message">
                    ❌ {error}
                </div>
            )}

            {success && (
                <div className="success-message">
                    {success}
                </div>
            )}

            {/* Current Model Info */}
            <div className="model-info-section">
                <h2>📊 Thông Tin Model Hiện Tại</h2>
                {modelInfo ? (
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="info-label">Model Type:</span>
                            <span className="info-value">{modelInfo.modelType || 'LightGCN'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Last Trained:</span>
                            <span className="info-value">
                                {modelInfo.lastTrained 
                                    ? new Date(modelInfo.lastTrained).toLocaleString('vi-VN')
                                    : 'Chưa train'}
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Accuracy:</span>
                            <span className="info-value">
                                {modelInfo.accuracy ? `${(modelInfo.accuracy * 100).toFixed(2)}%` : '—'}
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Total Epochs:</span>
                            <span className="info-value">{modelInfo.epochs || '—'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Training Data:</span>
                            <span className="info-value">{modelInfo.trainingDataSize || 0} samples</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Model Version:</span>
                            <span className="info-value">{modelInfo.version || '1.0'}</span>
                        </div>
                    </div>
                ) : (
                    <p>Chưa có thông tin model</p>
                )}
            </div>

            {/* Training Configuration */}
            <div className="training-config-section">
                <h2>⚙️ Cấu Hình Training</h2>
                <div className="config-grid">
                    <div className="config-item">
                        <label>Model Type:</label>
                        <select
                            value={config.modelType}
                            onChange={(e) => setConfig({...config, modelType: e.target.value})}
                            disabled={training}
                        >
                            <option value="lightgcn">LightGCN</option>
                            <option value="gcn">GCN</option>
                            <option value="graphsage">GraphSAGE</option>
                            <option value="kgat">KGAT</option>
                        </select>
                    </div>
                    <div className="config-item">
                        <label>Epochs:</label>
                        <input
                            type="number"
                            value={config.epochs}
                            onChange={(e) => setConfig({...config, epochs: parseInt(e.target.value)})}
                            disabled={training}
                            min="10"
                            max="1000"
                        />
                    </div>
                    <div className="config-item">
                        <label>Learning Rate:</label>
                        <input
                            type="number"
                            step="0.0001"
                            value={config.learningRate}
                            onChange={(e) => setConfig({...config, learningRate: parseFloat(e.target.value)})}
                            disabled={training}
                            min="0.0001"
                            max="0.1"
                        />
                    </div>
                    <div className="config-item">
                        <label>Batch Size:</label>
                        <input
                            type="number"
                            value={config.batchSize}
                            onChange={(e) => setConfig({...config, batchSize: parseInt(e.target.value)})}
                            disabled={training}
                            min="32"
                            max="4096"
                        />
                    </div>
                    <div className="config-item">
                        <label>Embedding Size:</label>
                        <input
                            type="number"
                            value={config.embeddingSize}
                            onChange={(e) => setConfig({...config, embeddingSize: parseInt(e.target.value)})}
                            disabled={training}
                            min="16"
                            max="256"
                        />
                    </div>
                </div>
            </div>

            {/* Training Progress */}
            {training && trainingProgress && (
                <div className="training-progress-section">
                    <h2>🔄 Đang Training Model...</h2>
                    <div className="progress-info">
                        <div className="progress-status">
                            Status: <strong>{trainingProgress.status}</strong>
                        </div>
                        {trainingProgress.epoch && (
                            <div className="progress-epoch">
                                Epoch: <strong>{trainingProgress.epoch} / {config.epochs}</strong>
                            </div>
                        )}
                        {trainingProgress.loss && (
                            <div className="progress-loss">
                                Loss: <strong>{trainingProgress.loss.toFixed(4)}</strong>
                            </div>
                        )}
                    </div>
                    <div className="progress-bar">
                        <div 
                            className="progress-fill"
                            style={{ 
                                width: `${(trainingProgress.epoch / config.epochs) * 100}%` 
                            }}
                        ></div>
                    </div>
                </div>
            )}

            {/* Train Button */}
            <div className="action-section">
                <button
                    className="btn-train"
                    onClick={handleTrainModel}
                    disabled={training}
                >
                    {training ? '⏳ Đang Training...' : '🚀 Train Model Mới'}
                </button>
                {training && (
                    <p className="training-note">
                        ⚠️ Vui lòng không đóng trang trong khi training
                    </p>
                )}
            </div>

            {/* Training History */}
            <div className="training-history-section">
                <h2>📜 Lịch Sử Training</h2>
                {modelInfo?.trainingHistory && modelInfo.trainingHistory.length > 0 ? (
                    <div className="history-table">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Thời Gian</th>
                                    <th>Model Type</th>
                                    <th>Epochs</th>
                                    <th>Final Loss</th>
                                    <th>Accuracy</th>
                                    <th>Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                {modelInfo.trainingHistory.map((history, index) => (
                                    <tr key={index}>
                                        <td>{new Date(history.timestamp).toLocaleString('vi-VN')}</td>
                                        <td>{history.modelType}</td>
                                        <td>{history.epochs}</td>
                                        <td>{history.finalLoss?.toFixed(4) || '—'}</td>
                                        <td>{history.accuracy ? `${(history.accuracy * 100).toFixed(2)}%` : '—'}</td>
                                        <td>{history.duration || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p>Chưa có lịch sử training</p>
                )}
            </div>
        </div>
    );
};

export default AdminModel;
