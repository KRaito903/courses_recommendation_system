// src/components/GraphSaveManager.jsx
import React, { useState, useEffect } from 'react';
import './GraphSaveManager.css';

const GraphSaveManager = ({ isOpen, onClose, currentGraph }) => {
    const [savedGraphs, setSavedGraphs] = useState([]);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

    useEffect(() => {
        if (isOpen) {
            loadSavedGraphs();
        }
    }, [isOpen]);

    const loadSavedGraphs = () => {
        try {
            const saved = localStorage.getItem('savedGraphs');
            if (saved) {
                setSavedGraphs(JSON.parse(saved));
            }
        } catch (error) {
            console.error('Error loading saved graphs:', error);
        }
    };

    const handleDeleteGraph = (graphId) => {
        if (confirm('Xóa graph này khỏi danh sách đã lưu?')) {
            const updated = savedGraphs.filter(g => g.id !== graphId);
            setSavedGraphs(updated);
            localStorage.setItem('savedGraphs', JSON.stringify(updated));
        }
    };

    const handleExportGraph = (graph) => {
        const dataStr = JSON.stringify({
            ...graph.data,
            name: graph.name,
            savedAt: graph.timestamp
        }, null, 2);
        
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${graph.name.replace(/\s+/g, '-')}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleDownloadImage = (graph) => {
        const link = document.createElement('a');
        link.href = graph.image;
        link.download = `${graph.name.replace(/\s+/g, '-')}.png`;
        link.click();
    };

    const handleClearAll = () => {
        if (confirm(`Xóa tất cả ${savedGraphs.length} graph đã lưu?\n\nHành động này không thể hoàn tác!`)) {
            setSavedGraphs([]);
            localStorage.removeItem('savedGraphs');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="graph-save-manager-overlay" onClick={onClose}>
            <div className="graph-save-manager-modal" onClick={(e) => e.stopPropagation()}>
                <div className="manager-header">
                    <div>
                        <h2>📚 Quản Lý Graph Đã Lưu</h2>
                        <p>{savedGraphs.length} graph trong kho lưu trữ</p>
                    </div>
                    <div className="manager-header-actions">
                        <button 
                            className="btn-view-mode"
                            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                            title={viewMode === 'grid' ? 'Chuyển sang dạng danh sách' : 'Chuyển sang dạng lưới'}
                        >
                            {viewMode === 'grid' ? '☰' : '⊞'}
                        </button>
                        {savedGraphs.length > 0 && (
                            <button className="btn-clear-all" onClick={handleClearAll}>
                                🗑️ Xóa tất cả
                            </button>
                        )}
                        <button className="btn-close-modal" onClick={onClose}>
                            ✕
                        </button>
                    </div>
                </div>

                {savedGraphs.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📭</div>
                        <h3>Chưa có graph nào được lưu</h3>
                        <p>Hãy mở graph ở chế độ toàn màn hình và nhấn "💾 Lưu Graph" để bắt đầu!</p>
                    </div>
                ) : (
                    <div className={`manager-content ${viewMode}-view`}>
                        {savedGraphs.map(graph => (
                            <div key={graph.id} className="saved-graph-card">
                                <div className="card-image">
                                    <img src={graph.image} alt={graph.name} />
                                    <div className="card-overlay">
                                        <button 
                                            className="btn-overlay"
                                            onClick={() => handleDownloadImage(graph)}
                                            title="Tải ảnh"
                                        >
                                            📥
                                        </button>
                                        <button 
                                            className="btn-overlay"
                                            onClick={() => handleExportGraph(graph)}
                                            title="Xuất JSON"
                                        >
                                            📄
                                        </button>
                                        <button 
                                            className="btn-overlay btn-delete"
                                            onClick={() => handleDeleteGraph(graph.id)}
                                            title="Xóa"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                                <div className="card-info">
                                    <h3>{graph.name}</h3>
                                    <div className="card-meta">
                                        <span className="graph-type">
                                            {graph.type === 'profile-based' ? '👤 Hồ sơ' : '👥 Cộng đồng'}
                                        </span>
                                        <span className="graph-date">
                                            {new Date(graph.timestamp).toLocaleDateString('vi-VN', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <div className="card-stats">
                                        <span>📚 {graph.coursesCount} gợi ý</span>
                                        <span>•</span>
                                        <span>✓ {graph.enrolledCount} đã học</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GraphSaveManager;
