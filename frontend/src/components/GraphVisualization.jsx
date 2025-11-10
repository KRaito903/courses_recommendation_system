// src/components/GraphVisualization.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network/standalone';
import './GraphVisualization.css';

const GraphVisualization = ({ courses = [], enrolledCourses = [], graphType = 'profile-based' }) => {
    const containerRef = useRef(null);
    const networkRef = useRef(null);
    const [hoveredNode, setHoveredNode] = useState(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Prepare nodes for vis-network
        const nodes = [];
        const edges = [];

        // User node (center)
        nodes.push({
            id: 'user',
            label: '👤\nBạn',
            title: 'Bạn (Học viên)\nTrung tâm của biểu đồ',
            shape: 'circle',
            size: 40,
            color: {
                background: '#6366f1',
                border: '#4f46e5',
                highlight: {
                    background: '#818cf8',
                    border: '#6366f1'
                },
                hover: {
                    background: '#818cf8',
                    border: '#6366f1'
                }
            },
            font: {
                size: 16,
                color: '#ffffff',
                face: 'Arial',
                bold: true,
                multi: 'html'
            },
            borderWidth: 3,
            borderWidthSelected: 4,
            shadow: {
                enabled: true,
                color: 'rgba(99, 102, 241, 0.3)',
                size: 15,
                x: 0,
                y: 3
            }
        });

        // Recommended courses
        const recommendedCount = Math.min(courses.length, 5);
        courses.slice(0, recommendedCount).forEach((course, i) => {
            const nodeId = `rec_${course.course_id || i}`;
            nodes.push({
                id: nodeId,
                label: `📚\n${course.course_code || 'N/A'}`,
                title: `${course.course_name || 'N/A'}\nMã: ${course.course_code || 'N/A'}\n🏆 Xếp hạng: #${course.rank || 'N/A'}`,
                shape: 'circle',
                size: 35,
                color: {
                    background: '#10b981',
                    border: '#059669',
                    highlight: {
                        background: '#34d399',
                        border: '#10b981'
                    },
                    hover: {
                        background: '#34d399',
                        border: '#10b981'
                    }
                },
                font: {
                    size: 13,
                    color: '#ffffff',
                    face: 'Arial',
                    bold: true,
                    multi: 'html'
                },
                borderWidth: 3,
                borderWidthSelected: 4,
                shadow: {
                    enabled: true,
                    color: 'rgba(16, 185, 129, 0.3)',
                    size: 12,
                    x: 0,
                    y: 3
                },
                courseData: course
            });

            // Edge from user to recommended course
            edges.push({
                from: 'user',
                to: nodeId,
                label: 'Được gợi ý',
                arrows: {
                    to: {
                        enabled: true,
                        scaleFactor: 1.2
                    }
                },
                color: {
                    color: '#10b98199',
                    highlight: '#10b981',
                    hover: '#10b981'
                },
                width: 4,
                smooth: {
                    type: 'cubicBezier',
                    forceDirection: 'vertical',
                    roundness: 0.6
                },
                font: {
                    size: 12,
                    color: '#1e293b',
                    strokeWidth: 4,
                    strokeColor: '#ffffff',
                    bold: true,
                    align: 'middle',
                    background: '#ffffff'
                },
                shadow: {
                    enabled: true,
                    color: 'rgba(0, 0, 0, 0.15)',
                    size: 8,
                    x: 0,
                    y: 2
                }
            });
        });

        // Enrolled courses
        const enrolledCount = Math.min(enrolledCourses.length, 3);
        enrolledCourses.slice(0, enrolledCount).forEach((course, i) => {
            const nodeId = `enr_${course.course_id || i}`;
            nodes.push({
                id: nodeId,
                label: `✓\n${course.course_code || 'N/A'}`,
                title: `${course.course_name || 'N/A'}\nMã: ${course.course_code || 'N/A'}\n✓ Đã hoàn thành`,
                shape: 'circle',
                size: 32,
                color: {
                    background: '#f59e0b',
                    border: '#d97706',
                    highlight: {
                        background: '#fbbf24',
                        border: '#f59e0b'
                    },
                    hover: {
                        background: '#fbbf24',
                        border: '#f59e0b'
                    }
                },
                font: {
                    size: 13,
                    color: '#ffffff',
                    face: 'Arial',
                    bold: true,
                    multi: 'html'
                },
                borderWidth: 3,
                borderWidthSelected: 4,
                shadow: {
                    enabled: true,
                    color: 'rgba(245, 158, 11, 0.3)',
                    size: 12,
                    x: 0,
                    y: 3
                },
                courseData: course
            });

            // Edge from user to enrolled course
            edges.push({
                from: 'user',
                to: nodeId,
                label: 'Đã học',
                arrows: {
                    to: {
                        enabled: true,
                        scaleFactor: 1.2
                    }
                },
                color: {
                    color: '#f59e0b99',
                    highlight: '#f59e0b',
                    hover: '#f59e0b'
                },
                width: 4,
                smooth: {
                    type: 'cubicBezier',
                    forceDirection: 'vertical',
                    roundness: 0.6
                },
                font: {
                    size: 12,
                    color: '#1e293b',
                    strokeWidth: 4,
                    strokeColor: '#ffffff',
                    bold: true,
                    align: 'middle',
                    background: '#ffffff'
                },
                shadow: {
                    enabled: true,
                    color: 'rgba(0, 0, 0, 0.15)',
                    size: 8,
                    x: 0,
                    y: 2
                }
            });
        });

        // Network options
        const options = {
            nodes: {
                shape: 'circle',
                scaling: {
                    min: 10,
                    max: 50,
                    label: {
                        enabled: true,
                        min: 12,
                        max: 18
                    }
                }
            },
            edges: {
                smooth: {
                    enabled: true,
                    type: 'cubicBezier',
                    roundness: 0.6
                },
                hoverWidth: 1.5
            },
            physics: {
                enabled: true,
                stabilization: {
                    enabled: true,
                    iterations: 200,
                    updateInterval: 25
                },
                barnesHut: {
                    gravitationalConstant: -8000,
                    centralGravity: 0.3,
                    springLength: 200,
                    springConstant: 0.04,
                    damping: 0.09,
                    avoidOverlap: 0.5
                },
                solver: 'barnesHut'
            },
            layout: {
                improvedLayout: true,
                hierarchical: {
                    enabled: false
                }
            },
            interaction: {
                hover: true,
                tooltipDelay: 100,
                zoomView: true,
                dragView: true,
                dragNodes: true,
                navigationButtons: true,
                keyboard: {
                    enabled: true
                },
                tooltipStyle: 'div'
            },
            configure: {
                enabled: false
            }
        };

        // Create network
        const network = new Network(
            containerRef.current,
            { nodes, edges },
            options
        );

        networkRef.current = network;

        // Event handlers
        network.on('hoverNode', (params) => {
            const nodeId = params.node;
            const node = nodes.find(n => n.id === nodeId);
            if (node) {
                setHoveredNode({
                    id: nodeId,
                    label: node.label,
                    title: node.title,
                    courseData: node.courseData
                });
            }
        });

        network.on('blurNode', () => {
            setHoveredNode(null);
        });

        network.on('selectNode', (params) => {
            const nodeId = params.nodes[0];
            const node = nodes.find(n => n.id === nodeId);
            if (node && node.courseData) {
                console.log('Selected course:', node.courseData);
            }
        });

        // Cleanup
        return () => {
            if (networkRef.current) {
                networkRef.current.destroy();
                networkRef.current = null;
            }
        };
    }, [courses, enrolledCourses, graphType]);

    const getTitleText = () => {
        return graphType === 'profile-based'
            ? '📊 Biểu Đồ Gợi Ý Từ Hồ Sơ Cá Nhân'
            : '📊 Biểu Đồ Gợi Ý Từ Cộng Đồng';
    };

    return (
        <div className="graph-visualization-wrapper">
            <div className="graph-title">
                <h3>{getTitleText()}</h3>
            </div>
            
            <div ref={containerRef} className="vis-network-container" />

            <div className="graph-info">
                <div className="info-item">
                    <span className="info-label">📚 Gợi ý:</span>
                    <span className="info-value">{courses.length} môn</span>
                </div>
                <div className="info-item">
                    <span className="info-label">✓ Đã học:</span>
                    <span className="info-value">{enrolledCourses.length} môn</span>
                </div>
                <div className="info-item">
                    <span className="info-label">🔗 Kết nối:</span>
                    <span className="info-value">{courses.length + enrolledCourses.length}</span>
                </div>
            </div>

            <div className="graph-legend">
                <div className="legend-title">📋 Chú Giải</div>
                <div className="legend-items">
                    <div className="legend-item">
                        <div className="legend-color" style={{ backgroundColor: '#6366f1' }}></div>
                        <span>👤 Bạn</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color" style={{ backgroundColor: '#10b981' }}></div>
                        <span>📚 Gợi ý</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color" style={{ backgroundColor: '#f59e0b' }}></div>
                        <span>✓ Đã học</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GraphVisualization;
