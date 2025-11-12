import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import GraphVisualization from '../components/GraphVisualization';
import './GraphFullScreen.css';

const GraphFullScreen = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const graphRef = useRef(null);
    const [graphData, setGraphData] = useState({
        courses: [],
        enrolledCourses: [],
        graphType: 'profile-based'
    });
    const [showSettings, setShowSettings] = useState(false);
    const [exportFormat, setExportFormat] = useState('png');
    const [exportQuality, setExportQuality] = useState('high');
    const [includeTimestamp, setIncludeTimestamp] = useState(true);
    const [savedGraphs, setSavedGraphs] = useState([]);

    useEffect(() => {
        // Get data from location state or sessionStorage (for new tab)
        if (location.state) {
            setGraphData({
                courses: location.state.courses || [],
                enrolledCourses: location.state.enrolledCourses || [],
                graphType: location.state.graphType || 'profile-based'
            });
        } else {
            // Try to get from sessionStorage (when opened in new tab)
            const storedData = sessionStorage.getItem('graphData');
            if (storedData) {
                try {
                    const data = JSON.parse(storedData);
                    setGraphData({
                        courses: data.courses || [],
                        enrolledCourses: data.enrolledCourses || [],
                        graphType: data.graphType || 'profile-based'
                    });
                    // Clear after use
                    sessionStorage.removeItem('graphData');
                } catch (error) {
                    console.error('Error parsing graph data:', error);
                }
            }
        }

        // Load saved graphs from localStorage
        loadSavedGraphs();
    }, [location.state]);

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

    const handleExport = () => {
        const canvas = document.querySelector('canvas');
        if (!canvas) {
            alert('Không tìm thấy graph để xuất!');
            return;
        }

        const timestamp = includeTimestamp ? `-${new Date().toISOString().slice(0, 10)}` : '';
        const quality = exportQuality === 'high' ? 1.0 : exportQuality === 'medium' ? 0.8 : 0.6;
        
        let mimeType, extension;
        if (exportFormat === 'jpg') {
            mimeType = 'image/jpeg';
            extension = 'jpg';
        } else if (exportFormat === 'svg') {
            // For SVG, we need to convert canvas to SVG (basic implementation)
            alert('Xuất SVG đang được phát triển. Vui lòng chọn PNG hoặc JPG.');
            return;
        } else {
            mimeType = 'image/png';
            extension = 'png';
        }

        const link = document.createElement('a');
        link.href = canvas.toDataURL(mimeType, quality);
        link.download = `graph-${graphData.graphType}${timestamp}.${extension}`;
        link.click();
    };

    const handleSaveGraph = () => {
        const canvas = document.querySelector('canvas');
        if (!canvas) {
            alert('Không tìm thấy graph để lưu!');
            return;
        }

        const graphName = prompt('Nhập tên cho graph này:', 
            `Graph ${graphData.graphType} - ${new Date().toLocaleDateString('vi-VN')}`);
        
        if (!graphName) return;

        const newGraph = {
            id: Date.now(),
            name: graphName,
            type: graphData.graphType,
            image: canvas.toDataURL('image/png', 0.8),
            timestamp: new Date().toISOString(),
            coursesCount: graphData.courses.length,
            enrolledCount: graphData.enrolledCourses.length,
            data: {
                courses: graphData.courses,
                enrolledCourses: graphData.enrolledCourses,
                graphType: graphData.graphType
            }
        };

        const updated = [newGraph, ...savedGraphs].slice(0, 10); // Keep only 10 latest
        setSavedGraphs(updated);
        localStorage.setItem('savedGraphs', JSON.stringify(updated));
        alert('✅ Đã lưu graph thành công!');
    };

    const handleLoadGraph = (graph) => {
        if (confirm(`Tải graph "${graph.name}"?`)) {
            setGraphData(graph.data);
        }
    };

    const handleDeleteGraph = (graphId, e) => {
        e.stopPropagation();
        if (confirm('Xóa graph này?')) {
            const updated = savedGraphs.filter(g => g.id !== graphId);
            setSavedGraphs(updated);
            localStorage.setItem('savedGraphs', JSON.stringify(updated));
        }
    };

    const handleExportJSON = () => {
        const dataStr = JSON.stringify({
            ...graphData,
            exportedAt: new Date().toISOString(),
            coursesCount: graphData.courses.length,
            enrolledCount: graphData.enrolledCourses.length
        }, null, 2);
        
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `graph-data-${graphData.graphType}-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleOpenEditor = () => {
        // Store data for editor page
        sessionStorage.setItem('graphEditorData', JSON.stringify(graphData));
        navigate('/graph-editor', {
            state: graphData
        });
    };

    const handleClose = () => {
        // If opened in new tab, close the tab
        if (window.opener) {
            window.close();
        } else {
            // Otherwise, navigate back
            navigate(-1);
        }
    };

    const getTitle = () => {
        return graphData.graphType === 'profile-based' 
            ? '📊 Biểu Đồ Gợi Ý Từ Hồ Sơ Cá Nhân'
            : '📊 Biểu Đồ Gợi Ý Từ Cộng Đồng';
    };

    return (
        <div className="graph-fullscreen-container">
            <div className="graph-fullscreen-header">
                <div className="header-content">
                    <h1>{getTitle()}</h1>
                    <p>Kết nối giữa bạn, các môn học đã học, và các môn được gợi ý</p>
                </div>
                <div className="header-actions">
                    <button className="btn-action" onClick={handleOpenEditor}>
                        🎨 Chỉnh Sửa
                    </button>
                    <button className="btn-action" onClick={() => setShowSettings(!showSettings)}>
                        ⚙️ Tuỳ chỉnh
                    </button>
                    <button className="btn-action" onClick={handleSaveGraph}>
                        💾 Lưu Graph
                    </button>
                    <button className="btn-action" onClick={handleExport}>
                        📥 Xuất Ảnh
                    </button>
                    <button className="btn-action" onClick={handleExportJSON}>
                        📄 Xuất JSON
                    </button>
                    <button className="btn-action" onClick={handlePrint}>
                        🖨️ In
                    </button>
                    <button className="btn-action btn-close" onClick={handleClose}>
                        ✕ Đóng
                    </button>
                </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
                <div className="settings-panel">
                    <div className="settings-content">
                        <h3>⚙️ Cài Đặt Xuất File</h3>
                        
                        <div className="setting-group">
                            <label>Định dạng xuất:</label>
                            <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
                                <option value="png">PNG (Nền trong suốt)</option>
                                <option value="jpg">JPG (Nền trắng, nhẹ hơn)</option>
                            </select>
                        </div>

                        <div className="setting-group">
                            <label>Chất lượng:</label>
                            <select value={exportQuality} onChange={(e) => setExportQuality(e.target.value)}>
                                <option value="high">Cao (100%)</option>
                                <option value="medium">Trung bình (80%)</option>
                                <option value="low">Thấp (60%, file nhẹ)</option>
                            </select>
                        </div>

                        <div className="setting-group">
                            <label>
                                <input 
                                    type="checkbox" 
                                    checked={includeTimestamp}
                                    onChange={(e) => setIncludeTimestamp(e.target.checked)}
                                />
                                Thêm ngày tháng vào tên file
                            </label>
                        </div>

                        <div className="setting-info">
                            <p>💡 <strong>Mẹo:</strong></p>
                            <ul>
                                <li>PNG: Tốt nhất cho chất lượng, hỗ trợ nền trong suốt</li>
                                <li>JPG: File nhẹ hơn, phù hợp để chia sẻ</li>
                                <li>JSON: Xuất dữ liệu để phân tích hoặc backup</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Saved Graphs Sidebar */}
            {savedGraphs.length > 0 && (
                <div className="saved-graphs-sidebar">
                    <h3>📚 Graph Đã Lưu ({savedGraphs.length}/10)</h3>
                    <div className="saved-graphs-list">
                        {savedGraphs.map(graph => (
                            <div key={graph.id} className="saved-graph-item" onClick={() => handleLoadGraph(graph)}>
                                <img src={graph.image} alt={graph.name} />
                                <div className="saved-graph-info">
                                    <h4>{graph.name}</h4>
                                    <p>{new Date(graph.timestamp).toLocaleDateString('vi-VN')}</p>
                                    <p className="graph-stats">
                                        📚 {graph.coursesCount} gợi ý • ✓ {graph.enrolledCount} đã học
                                    </p>
                                </div>
                                <button 
                                    className="btn-delete-graph"
                                    onClick={(e) => handleDeleteGraph(graph.id, e)}
                                    title="Xóa graph"
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="graph-fullscreen-content" ref={graphRef}>
                <GraphVisualization 
                    courses={graphData.courses}
                    enrolledCourses={graphData.enrolledCourses}
                    graphType={graphData.graphType}
                />
            </div>

            <div className="graph-fullscreen-footer">
                <div className="footer-info">
                    <span>📚 Gợi ý: {graphData.courses.length} môn</span>
                    <span className="separator">|</span>
                    <span>✓ Đã học: {graphData.enrolledCourses.length} môn</span>
                    <span className="separator">|</span>
                    <span>🔗 Kết nối: {graphData.courses.length + graphData.enrolledCourses.length}</span>
                    {savedGraphs.length > 0 && (
                        <>
                            <span className="separator">|</span>
                            <span>💾 Đã lưu: {savedGraphs.length} graph</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GraphFullScreen;
