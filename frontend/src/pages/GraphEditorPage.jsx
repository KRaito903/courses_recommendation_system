// src/pages/GraphEditorPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import GraphEditor from '../components/GraphEditor';
import './GraphEditorPage.css';

const GraphEditorPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showInstructions, setShowInstructions] = useState(false);
    const [graphData, setGraphData] = useState({
        courses: [],
        enrolledCourses: []
    });

    useEffect(() => {
        // Get data from location state or sessionStorage
        if (location.state) {
            setGraphData({
                courses: location.state.courses || [],
                enrolledCourses: location.state.enrolledCourses || []
            });
        } else {
            const storedData = sessionStorage.getItem('graphEditorData');
            if (storedData) {
                try {
                    const data = JSON.parse(storedData);
                    setGraphData(data);
                    sessionStorage.removeItem('graphEditorData');
                } catch (error) {
                    console.error('Error parsing graph data:', error);
                }
            }
        }
    }, [location.state]);

    const handleSave = (editedData) => {
        console.log('Saved graph data:', editedData);
        
        // Save to localStorage
        const savedGraphs = JSON.parse(localStorage.getItem('editedGraphs') || '[]');
        savedGraphs.unshift({
            id: Date.now(),
            timestamp: editedData.timestamp,
            nodes: editedData.nodes,
            edges: editedData.edges
        });
        
        // Keep only 20 latest
        localStorage.setItem('editedGraphs', JSON.stringify(savedGraphs.slice(0, 20)));
    };

    const handleBack = () => {
        if (confirm('Thoát chế độ chỉnh sửa? Các thay đổi chưa lưu sẽ mất.')) {
            navigate(-1);
        }
    };

    return (
        <div className="graph-editor-page">
            <div className="editor-header">
                <div className="header-left">
                    <button className="btn-back" onClick={handleBack}>
                        ← Quay lại
                    </button>
                    <div className="header-info">
                        <h1>🎨 Chỉnh Sửa Graph</h1>
                        <p>Thêm, xóa, và tuỳ chỉnh nodes & edges</p>
                    </div>
                </div>
                <div className="header-stats">
                    <button 
                        className="btn-help"
                        onClick={() => setShowInstructions(!showInstructions)}
                    >
                        {showInstructions ? '✕ Đóng' : '❓ Hướng dẫn'}
                    </button>
                    <div className="stat-card">
                        <span className="stat-value">{graphData.courses.length}</span>
                        <span className="stat-label">Gợi ý</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value">{graphData.enrolledCourses.length}</span>
                        <span className="stat-label">Đã học</span>
                    </div>
                </div>
            </div>

            <div className="editor-content">
                <GraphEditor 
                    initialCourses={graphData.courses}
                    initialEnrolled={graphData.enrolledCourses}
                    onSave={handleSave}
                />
            </div>

            {/* Instructions Modal - Only show when toggled */}
            {showInstructions && (
                <div className="instructions-modal-overlay" onClick={() => setShowInstructions(false)}>
                    <div className="instructions-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="instructions-header">
                            <h3>📖 Hướng Dẫn Sử Dụng Graph Editor</h3>
                            <button 
                                className="btn-close-instructions"
                                onClick={() => setShowInstructions(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="instructions-content">
                            <div className="instructions-grid">
                                <div className="instruction-item">
                                    <span className="instruction-icon">➕</span>
                                    <div>
                                        <strong>Thêm Node</strong>
                                        <p>Chọn chế độ "Thêm Node" → Click vào canvas</p>
                                    </div>
                                </div>
                                <div className="instruction-item">
                                    <span className="instruction-icon">✏️</span>
                                    <div>
                                        <strong>Sửa Node</strong>
                                        <p>Double-click vào node bất kỳ</p>
                                    </div>
                                </div>
                                <div className="instruction-item">
                                    <span className="instruction-icon">🗑️</span>
                                    <div>
                                        <strong>Xóa Node</strong>
                                        <p>Chọn chế độ "Xóa Node" → Click vào node</p>
                                    </div>
                                </div>
                                <div className="instruction-item">
                                    <span className="instruction-icon">🔗</span>
                                    <div>
                                        <strong>Tạo Kết Nối</strong>
                                        <p>Chế độ "Thêm Kết Nối" → Click 2 nodes</p>
                                    </div>
                                </div>
                                <div className="instruction-item">
                                    <span className="instruction-icon">✂️</span>
                                    <div>
                                        <strong>Xóa Kết Nối</strong>
                                        <p>Select edge → Nhấn "Xóa Kết Nối"</p>
                                    </div>
                                </div>
                                <div className="instruction-item">
                                    <span className="instruction-icon">🔄</span>
                                    <div>
                                        <strong>Reset</strong>
                                        <p>Quay về trạng thái ban đầu</p>
                                    </div>
                                </div>
                                <div className="instruction-item">
                                    <span className="instruction-icon">💾</span>
                                    <div>
                                        <strong>Lưu</strong>
                                        <p>Lưu graph đã chỉnh sửa vào localStorage</p>
                                    </div>
                                </div>
                                <div className="instruction-item">
                                    <span className="instruction-icon">📥</span>
                                    <div>
                                        <strong>Xuất JSON</strong>
                                        <p>Download dữ liệu graph dạng JSON</p>
                                    </div>
                                </div>
                            </div>

                            <div className="instructions-tips">
                                <h4>💡 Mẹo Sử Dụng</h4>
                                <ul>
                                    <li><strong>Drag & Drop:</strong> Kéo thả nodes để sắp xếp lại</li>
                                    <li><strong>Zoom:</strong> Dùng scroll chuột để zoom in/out</li>
                                    <li><strong>Pan:</strong> Giữ chuột trái và kéo để di chuyển canvas</li>
                                    <li><strong>Multi-select:</strong> Giữ Ctrl/Cmd và click nhiều nodes</li>
                                    <li><strong>Keyboard:</strong> Dùng mũi tên để di chuyển canvas</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GraphEditorPage;
