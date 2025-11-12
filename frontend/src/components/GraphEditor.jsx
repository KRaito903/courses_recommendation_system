// src/components/GraphEditor.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network/standalone';
import './GraphEditor.css';

const GraphEditor = ({ initialCourses = [], initialEnrolled = [], onSave }) => {
    const containerRef = useRef(null);
    const networkRef = useRef(null);
    const editModeRef = useRef('view'); // Store current mode in ref
    const selectedNodeRef = useRef(null); // Store selected node in ref
    const clickTimeoutRef = useRef(null); // For handling click vs double-click
    
    const [editMode, setEditMode] = useState('view'); // 'view', 'add-node', 'add-edge', 'delete', 'edit'
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [selectedNode, setSelectedNode] = useState(null);
    const [showNodeModal, setShowNodeModal] = useState(false);
    const [nodeForm, setNodeForm] = useState({
        id: '',
        label: '',
        type: 'recommended', // 'user', 'recommended', 'enrolled'
        courseCode: '',
        courseName: '',
        rank: ''
    });

    // Debug modal state
    useEffect(() => {
        console.log('🔔 Modal state changed:', showNodeModal);
        if (showNodeModal) {
            console.log('📋 Node form data:', nodeForm);
        }
    }, [showNodeModal, nodeForm]);

    // Keep refs in sync with state
    useEffect(() => {
        editModeRef.current = editMode;
        console.log('🔄 Edit mode changed to:', editMode);
    }, [editMode]);

    useEffect(() => {
        selectedNodeRef.current = selectedNode;
    }, [selectedNode]);

    useEffect(() => {
        // Wait for container to be ready
        let attempts = 0;
        const maxAttempts = 10;
        
        const checkAndInit = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                console.log(`📏 Container size (attempt ${attempts + 1}):`, rect.width, 'x', rect.height);
                
                if (rect.width > 0 && rect.height > 0) {
                    initializeGraph();
                } else if (attempts < maxAttempts) {
                    attempts++;
                    setTimeout(checkAndInit, 200);
                } else {
                    console.error('❌ Container still has no size after', maxAttempts, 'attempts');
                }
            }
        };
        
        const timer = setTimeout(checkAndInit, 100);

        return () => {
            clearTimeout(timer);
            if (clickTimeoutRef.current) {
                clearTimeout(clickTimeoutRef.current);
            }
            if (networkRef.current) {
                networkRef.current.destroy();
                networkRef.current = null;
            }
        };
    }, [initialCourses, initialEnrolled]);

    const initializeGraph = () => {
        console.log('🎨 Initializing graph editor...');
        console.log('📚 Initial courses:', initialCourses.length);
        console.log('✓ Initial enrolled:', initialEnrolled.length);
        
        const nodesData = [];
        const edgesData = [];

        // User node
        nodesData.push({
            id: 'user',
            label: '👤\nBạn',
            title: 'User Node',
            type: 'user',
            shape: 'circle',
            size: 40,
            color: {
                background: '#6366f1',
                border: '#4f46e5'
            },
            font: { size: 16, color: '#ffffff', bold: true }
        });

        // Recommended courses
        initialCourses.forEach((course, i) => {
            const nodeId = `rec_${course.course_id || i}`;
            nodesData.push({
                id: nodeId,
                label: `📚\n${course.course_code || 'N/A'}`,
                title: course.course_name || 'N/A',
                type: 'recommended',
                courseData: course,
                shape: 'circle',
                size: 35,
                color: {
                    background: '#10b981',
                    border: '#059669'
                },
                font: { size: 13, color: '#ffffff', bold: true }
            });

            edgesData.push({
                from: 'user',
                to: nodeId,
                label: 'Gợi ý',
                arrows: 'to',
                color: { color: '#10b981', opacity: 0.5 }
            });
        });

        // Enrolled courses
        initialEnrolled.forEach((course, i) => {
            const nodeId = `enr_${course.course_id || i}`;
            nodesData.push({
                id: nodeId,
                label: `✓\n${course.course_code || 'N/A'}`,
                title: course.course_name || 'N/A',
                type: 'enrolled',
                courseData: course,
                shape: 'circle',
                size: 35,
                color: {
                    background: '#f59e0b',
                    border: '#d97706'
                },
                font: { size: 13, color: '#ffffff', bold: true }
            });

            edgesData.push({
                from: 'user',
                to: nodeId,
                label: 'Đã học',
                arrows: 'to',
                color: { color: '#f59e0b', opacity: 0.5 }
            });
        });

        setNodes(nodesData);
        setEdges(edgesData);
        
        console.log('✅ Total nodes created:', nodesData.length);
        console.log('✅ Total edges created:', edgesData.length);
        
        createNetwork(nodesData, edgesData);
    };

    const createNetwork = (nodesData, edgesData) => {
        if (!containerRef.current) return;

        const data = {
            nodes: nodesData,
            edges: edgesData
        };

        const options = {
            width: '100%',
            height: '100%',
            autoResize: true,
            nodes: {
                borderWidth: 3,
                borderWidthSelected: 4,
                shadow: {
                    enabled: true,
                    size: 12,
                    x: 0,
                    y: 3
                }
            },
            edges: {
                width: 2,
                smooth: {
                    type: 'continuous',
                    roundness: 0.5
                },
                font: {
                    size: 11,
                    align: 'middle',
                    background: 'white'
                }
            },
            physics: {
                enabled: true,
                barnesHut: {
                    gravitationalConstant: -30000,
                    centralGravity: 0.3,
                    springLength: 150,
                    springConstant: 0.04,
                    damping: 0.09,
                    avoidOverlap: 0.5
                },
                stabilization: {
                    enabled: true,
                    iterations: 150,
                    updateInterval: 25
                },
                solver: 'barnesHut'
            },
            layout: {
                improvedLayout: true,
                randomSeed: 42
            },
            interaction: {
                hover: true,
                tooltipDelay: 100,
                zoomView: true,
                dragView: true,
                dragNodes: true,
                multiselect: true
            }
        };

        if (networkRef.current) {
            networkRef.current.destroy();
        }

        networkRef.current = new Network(containerRef.current, data, options);

        console.log('🌐 Network created with', data.nodes.length, 'nodes');

        // Remove old event listeners first
        networkRef.current.off('click');
        networkRef.current.off('doubleClick');
        networkRef.current.off('hoverNode');
        networkRef.current.off('blurNode');

        // Event listeners - use arrow functions to avoid closure issues
        networkRef.current.on('click', (params) => {
            handleNetworkClick(params);
        });
        networkRef.current.on('doubleClick', (params) => {
            handleNetworkDoubleClick(params);
        });
        networkRef.current.on('hoverNode', (params) => {
            if (containerRef.current) {
                containerRef.current.style.cursor = 'pointer';
            }
        });
        networkRef.current.on('blurNode', () => {
            if (containerRef.current) {
                containerRef.current.style.cursor = 'default';
            }
        });

        // Event when stabilization is done
        networkRef.current.once('stabilizationIterationsDone', () => {
            console.log('✅ Graph stabilized');
            networkRef.current.fit();
        });

        // Fit graph after a short delay
        setTimeout(() => {
            if (networkRef.current) {
                networkRef.current.fit({ animation: true });
            }
        }, 500);
    };

    const handleNetworkClick = (params) => {
        // Clear any existing timeout
        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
        }

        // Use ref to get current mode (avoid closure issue)
        const currentMode = editModeRef.current;
        const currentSelectedNode = selectedNodeRef.current;
        
        console.log('🖱️ Click detected:', { 
            mode: currentMode,
            hasNode: params.nodes.length > 0,
            hasCanvas: !!params.pointer.canvas,
            canvas: params.pointer.canvas
        });

        // Delay click action to allow double-click to cancel it
        clickTimeoutRef.current = setTimeout(() => {
            if (currentMode === 'add-node') {
                // Add node at clicked position
                if (params.nodes.length === 0 && params.pointer.canvas) {
                    // Only add if clicking on empty space
                    console.log('✅ Opening modal to add node');
                    openNodeModal(params.pointer.canvas);
                } else {
                    console.log('💡 Click on empty space to add node');
                }
            } else if (currentMode === 'delete' && params.nodes.length > 0) {
                // Delete node
                console.log('🗑️ Deleting node:', params.nodes[0]);
                deleteNode(params.nodes[0]);
            } else if (currentMode === 'add-edge' && params.nodes.length > 0) {
                // Start edge connection
                if (!currentSelectedNode) {
                    setSelectedNode(params.nodes[0]);
                    console.log('✅ First node selected:', params.nodes[0]);
                    alert('Đã chọn node. Click vào node thứ hai để tạo kết nối.');
                } else {
                    console.log('🔗 Creating edge:', currentSelectedNode, '->', params.nodes[0]);
                    addEdge(currentSelectedNode, params.nodes[0]);
                    setSelectedNode(null);
                }
            }
            // Note: In 'view' mode, single click does nothing (wait for double-click to edit)
        }, 250); // 250ms delay to detect double-click
    };

    const handleNetworkDoubleClick = (params) => {
        // Cancel any pending click action
        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
        }

        if (params.nodes.length > 0) {
            console.log('✏️ Double-click on node:', params.nodes[0], '- Opening edit modal');
            editNode(params.nodes[0]);
        }
    };

    const openNodeModal = (position) => {
        console.log('📝 Opening node modal at position:', position);
        setNodeForm({
            id: `node_${Date.now()}`,
            label: '',
            type: 'recommended',
            courseCode: '',
            courseName: '',
            rank: '',
            x: position?.x || 0,
            y: position?.y || 0
        });
        setShowNodeModal(true);
    };

    const editNode = (nodeId) => {
        console.log('✏️ Attempting to edit node:', nodeId);
        console.log('📊 Current nodes in state:', nodes.length);
        
        // Get node directly from network instead of state (avoid closure)
        let node = null;
        try {
            const networkNode = networkRef.current.body.data.nodes.get(nodeId);
            console.log('🌐 Node from network:', networkNode);
            node = networkNode;
        } catch (error) {
            console.error('❌ Error getting node from network:', error);
            // Fallback to state
            node = nodes.find(n => n.id === nodeId);
        }
        
        if (!node) {
            console.error('❌ Node not found:', nodeId);
            console.error('Available nodes:', nodes.map(n => n.id));
            alert('Không tìm thấy node này!');
            return;
        }
        
        if (nodeId === 'user' || node.type === 'user') {
            console.log('⚠️ Cannot edit user node');
            alert('Không thể chỉnh sửa node người dùng!');
            return;
        }

        console.log('📝 Node data:', node);

        setNodeForm({
            id: node.id,
            label: node.label ? node.label.replace(/[📚✓]\n/, '') : '',
            type: node.type || 'recommended',
            courseCode: node.courseData?.course_code || '',
            courseName: node.courseData?.course_name || node.title || '',
            rank: node.courseData?.rank || ''
        });
        
        console.log('✅ Opening edit modal');
        setShowNodeModal(true);
    };

    const addNode = () => {
        if (!nodeForm.courseCode) {
            alert('Vui lòng nhập mã môn học!');
            return;
        }

        console.log('➕ Adding new node:', nodeForm);

        const icon = nodeForm.type === 'enrolled' ? '✓' : '📚';
        const color = nodeForm.type === 'enrolled' 
            ? { background: '#f59e0b', border: '#d97706' }
            : { background: '#10b981', border: '#059669' };

        const newNode = {
            id: nodeForm.id,
            label: `${icon}\n${nodeForm.courseCode}`,
            title: nodeForm.courseName || nodeForm.courseCode,
            type: nodeForm.type,
            courseData: {
                course_code: nodeForm.courseCode,
                course_name: nodeForm.courseName,
                rank: nodeForm.rank
            },
            shape: 'circle',
            size: 35,
            color: color,
            font: { size: 13, color: '#ffffff', bold: true },
            x: nodeForm.x,
            y: nodeForm.y
        };

        try {
            // Add to network first
            networkRef.current.body.data.nodes.add(newNode);
            
            // Auto connect to user
            const newEdge = {
                id: `edge_${nodeForm.id}`,
                from: 'user',
                to: nodeForm.id,
                label: nodeForm.type === 'enrolled' ? 'Đã học' : 'Gợi ý',
                arrows: 'to',
                color: { color: color.background, opacity: 0.5 },
                width: 2
            };
            networkRef.current.body.data.edges.add(newEdge);

            // Update state
            const updatedNodes = [...nodes, newNode];
            const updatedEdges = [...edges, newEdge];
            setNodes(updatedNodes);
            setEdges(updatedEdges);

            console.log('✅ Node added successfully');
            alert('✅ Đã thêm node thành công!');
        } catch (error) {
            console.error('❌ Error adding node:', error);
            alert('❌ Lỗi khi thêm node: ' + error.message);
        }

        setShowNodeModal(false);
    };

    const updateNode = () => {
        const nodeIndex = nodes.findIndex(n => n.id === nodeForm.id);
        if (nodeIndex === -1) return;

        const icon = nodeForm.type === 'enrolled' ? '✓' : '📚';
        const color = nodeForm.type === 'enrolled' 
            ? { background: '#f59e0b', border: '#d97706' }
            : { background: '#10b981', border: '#059669' };

        const updatedNode = {
            ...nodes[nodeIndex],
            label: `${icon}\n${nodeForm.courseCode}`,
            title: nodeForm.courseName,
            type: nodeForm.type,
            color: color,
            courseData: {
                course_code: nodeForm.courseCode,
                course_name: nodeForm.courseName,
                rank: nodeForm.rank
            }
        };

        const updatedNodes = [...nodes];
        updatedNodes[nodeIndex] = updatedNode;
        setNodes(updatedNodes);
        networkRef.current.body.data.nodes.update(updatedNode);

        setShowNodeModal(false);
    };

    const deleteNode = (nodeId) => {
        if (nodeId === 'user') {
            alert('Không thể xóa node người dùng!');
            return;
        }

        if (confirm('Xóa node này?')) {
            try {
                // Remove from network first
                networkRef.current.body.data.nodes.remove(nodeId);
                
                // Get all edges from network
                const allEdges = networkRef.current.body.data.edges.get();
                const edgesToRemove = allEdges
                    .filter(e => e.from === nodeId || e.to === nodeId)
                    .map(e => e.id);
                networkRef.current.body.data.edges.remove(edgesToRemove);
                
                // Update state
                const updatedNodes = nodes.filter(n => n.id !== nodeId);
                const updatedEdges = edges.filter(e => e.from !== nodeId && e.to !== nodeId);
                setNodes(updatedNodes);
                setEdges(updatedEdges);
                
                console.log('✅ Node deleted successfully');
            } catch (error) {
                console.error('❌ Error deleting node:', error);
                alert('Lỗi khi xóa node!');
            }
        }
    };

    const addEdge = (fromNode, toNode) => {
        if (fromNode === toNode) {
            alert('Không thể tạo kết nối với chính nó!');
            return;
        }

        console.log('🔗 Attempting to add edge:', fromNode, '->', toNode);

        // Check if edge already exists - get from network
        const allEdges = networkRef.current.body.data.edges.get();
        const exists = allEdges.some(e => 
            (e.from === fromNode && e.to === toNode) ||
            (e.from === toNode && e.to === fromNode)
        );

        if (exists) {
            alert('Kết nối đã tồn tại!');
            return;
        }

        const newEdge = {
            id: `edge_${Date.now()}`,
            from: fromNode,
            to: toNode,
            label: 'Liên quan',
            arrows: 'to',
            color: { color: '#94a3b8', opacity: 0.5 },
            width: 2
        };

        try {
            // Add to network first
            networkRef.current.body.data.edges.add(newEdge);
            // Update state using functional update
            setEdges(prev => [...prev, newEdge]);
            
            console.log('✅ Edge added successfully');
            alert('✅ Đã tạo kết nối thành công!');
        } catch (error) {
            console.error('❌ Error adding edge:', error);
            alert('❌ Lỗi khi tạo kết nối: ' + error.message);
        }
    };

    const deleteEdge = () => {
        const selected = networkRef.current.getSelectedEdges();
        if (selected.length === 0) {
            alert('Vui lòng chọn một kết nối để xóa!');
            return;
        }

        if (confirm(`Xóa ${selected.length} kết nối?`)) {
            try {
                // Remove from network first
                networkRef.current.body.data.edges.remove(selected);
                // Update state
                setEdges(prev => prev.filter(e => !selected.includes(e.id)));
                console.log('✅ Edges deleted successfully');
            } catch (error) {
                console.error('❌ Error deleting edges:', error);
                alert('Lỗi khi xóa kết nối!');
            }
        }
    };

    const handleSave = () => {
        // 1. Save data to localStorage
        const graphData = {
            nodes: nodes.filter(n => n.id !== 'user'),
            edges: edges,
            timestamp: new Date().toISOString()
        };

        if (onSave) {
            onSave(graphData);
        }

        // 2. Save as image
        const canvas = document.querySelector('.graph-editor-canvas canvas');
        if (canvas) {
            try {
                const link = document.createElement('a');
                link.href = canvas.toDataURL('image/png');
                link.download = `graph-edited-${Date.now()}.png`;
                link.click();
                
                alert('✅ Đã lưu graph và tải ảnh thành công!');
            } catch (error) {
                console.error('Error saving image:', error);
                alert('✅ Đã lưu graph! (Không thể tải ảnh)');
            }
        } else {
            alert('✅ Đã lưu graph!');
        }
    };

    const handleExport = () => {
        const dataStr = JSON.stringify({ nodes, edges }, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `graph-edited-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleReset = () => {
        if (confirm('Reset graph về trạng thái ban đầu?')) {
            initializeGraph();
            setEditMode('view');
            setSelectedNode(null);
        }
    };

    return (
        <div className="graph-editor-container" data-mode={editMode}>
            <div className="graph-editor-toolbar">
                <div className="toolbar-section">
                    <h3>🎨 Chế Độ Chỉnh Sửa</h3>
                    <div className="mode-buttons">
                        <button 
                            className={`mode-btn ${editMode === 'view' ? 'active' : ''}`}
                            onClick={() => { 
                                console.log('🔘 Switching to VIEW mode');
                                setEditMode('view'); 
                                setSelectedNode(null); 
                            }}
                        >
                            👁️ Xem
                        </button>
                        <button 
                            className={`mode-btn ${editMode === 'add-node' ? 'active' : ''}`}
                            onClick={() => { 
                                console.log('🔘 Switching to ADD-NODE mode');
                                setEditMode('add-node'); 
                                setSelectedNode(null); 
                            }}
                        >
                            ➕ Thêm Node
                        </button>
                        <button 
                            className={`mode-btn ${editMode === 'add-edge' ? 'active' : ''}`}
                            onClick={() => { 
                                console.log('🔘 Switching to ADD-EDGE mode');
                                setEditMode('add-edge'); 
                                setSelectedNode(null); 
                            }}
                        >
                            🔗 Thêm Kết Nối
                        </button>
                        <button 
                            className={`mode-btn ${editMode === 'delete' ? 'active' : ''}`}
                            onClick={() => { 
                                console.log('🔘 Switching to DELETE mode');
                                setEditMode('delete'); 
                                setSelectedNode(null); 
                            }}
                        >
                            🗑️ Xóa Node
                        </button>
                    </div>
                </div>

                <div className="toolbar-section">
                    <h3>🛠️ Thao Tác</h3>
                    <div className="action-buttons">
                        <button className="action-btn" onClick={deleteEdge}>
                            ✂️ Xóa Kết Nối
                        </button>
                        <button className="action-btn" onClick={handleReset}>
                            🔄 Reset
                        </button>
                        <button className="action-btn save" onClick={handleSave}>
                            💾 Lưu
                        </button>
                        <button className="action-btn" onClick={handleExport}>
                            📥 Xuất JSON
                        </button>
                        <button 
                            className="action-btn" 
                            onClick={() => {
                                console.log('🐛 Debug Info:');
                                console.log('- Edit Mode:', editMode);
                                console.log('- Nodes:', nodes.length);
                                console.log('- Edges:', edges.length);
                                console.log('- Network:', !!networkRef.current);
                                console.log('- Container:', !!containerRef.current);
                                if (networkRef.current) {
                                    console.log('- Network nodes:', networkRef.current.body.data.nodes.length);
                                    console.log('- Network edges:', networkRef.current.body.data.edges.length);
                                }
                            }}
                            title="Debug Info"
                        >
                            🐛 Debug
                        </button>
                    </div>
                </div>

                <div className="toolbar-info">
                    <p><strong>Tổng số:</strong> {nodes.length} nodes • {edges.length} edges</p>
                    <p className="help-text">
                        {editMode === 'view' && '💡 Double-click node để chỉnh sửa'}
                        {editMode === 'add-node' && '💡 Click vào canvas để thêm node mới'}
                        {editMode === 'add-edge' && '💡 Click 2 node để tạo kết nối'}
                        {editMode === 'delete' && '💡 Click node để xóa'}
                    </p>
                </div>
            </div>

            <div className="graph-editor-canvas" ref={containerRef}></div>

            {/* Node Modal */}
            {showNodeModal && (
                <div className="node-modal-overlay" onClick={() => setShowNodeModal(false)}>
                    <div className="node-modal" onClick={(e) => e.stopPropagation()}>
                        <h2>{nodes.find(n => n.id === nodeForm.id) ? '✏️ Chỉnh Sửa Node' : '➕ Thêm Node Mới'}</h2>
                        
                        <div className="form-group">
                            <label>Loại Node:</label>
                            <select 
                                value={nodeForm.type} 
                                onChange={(e) => setNodeForm({...nodeForm, type: e.target.value})}
                            >
                                <option value="recommended">📚 Gợi ý</option>
                                <option value="enrolled">✓ Đã học</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Mã môn học: *</label>
                            <input 
                                type="text"
                                value={nodeForm.courseCode}
                                onChange={(e) => setNodeForm({...nodeForm, courseCode: e.target.value})}
                                placeholder="VD: IT3190"
                            />
                        </div>

                        <div className="form-group">
                            <label>Tên môn học:</label>
                            <input 
                                type="text"
                                value={nodeForm.courseName}
                                onChange={(e) => setNodeForm({...nodeForm, courseName: e.target.value})}
                                placeholder="VD: Đồ án thiết kế hệ thống thông tin"
                            />
                        </div>

                        <div className="form-group">
                            <label>Thứ hạng:</label>
                            <input 
                                type="number"
                                value={nodeForm.rank}
                                onChange={(e) => setNodeForm({...nodeForm, rank: e.target.value})}
                                placeholder="VD: 1"
                            />
                        </div>

                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setShowNodeModal(false)}>
                                Hủy
                            </button>
                            <button 
                                className="btn-save" 
                                onClick={nodes.find(n => n.id === nodeForm.id) ? updateNode : addNode}
                            >
                                {nodes.find(n => n.id === nodeForm.id) ? 'Cập nhật' : 'Thêm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GraphEditor;
