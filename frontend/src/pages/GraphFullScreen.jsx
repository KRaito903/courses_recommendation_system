import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import GraphVisualization from '../components/GraphVisualization';
import './GraphFullScreen.css';

const GraphFullScreen = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [graphData, setGraphData] = useState({
        courses: [],
        enrolledCourses: [],
        graphType: 'profile-based'
    });

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
    }, [location.state]);

    const handleExport = () => {
        // Get canvas and download as image
        const canvas = document.querySelector('canvas');
        if (canvas) {
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = `graph-${graphData.graphType}-${Date.now()}.png`;
            link.click();
        }
    };

    const handlePrint = () => {
        window.print();
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
                    <button className="btn-action" onClick={handleExport}>
                        💾 Xuất PNG
                    </button>
                    <button className="btn-action" onClick={handlePrint}>
                        🖨️ In
                    </button>
                    <button className="btn-action btn-close" onClick={handleClose}>
                        ✕ Đóng
                    </button>
                </div>
            </div>

            <div className="graph-fullscreen-content">
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
                </div>
            </div>
        </div>
    );
};

export default GraphFullScreen;
