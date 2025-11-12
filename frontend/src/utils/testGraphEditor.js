// Test GraphEditor với dữ liệu mẫu
// Copy và paste vào browser console khi mở GraphEditorPage

console.log('🧪 Testing GraphEditor Data Flow');
console.log('================================\n');

// 1. Check sessionStorage
const sessionData = sessionStorage.getItem('graphEditorData');
if (sessionData) {
    const data = JSON.parse(sessionData);
    console.log('✅ SessionStorage data found:');
    console.log('   - Courses:', data.courses?.length || 0);
    console.log('   - Enrolled:', data.enrolledCourses?.length || 0);
    console.log('   - Type:', data.graphType);
} else {
    console.log('❌ No data in sessionStorage');
}

// 2. Check if canvas exists
const canvas = document.querySelector('.graph-editor-canvas canvas');
if (canvas) {
    console.log('\n✅ Canvas found:');
    console.log('   - Width:', canvas.width);
    console.log('   - Height:', canvas.height);
    console.log('   - Style width:', canvas.style.width);
    console.log('   - Style height:', canvas.style.height);
    
    if (canvas.width > 5000 || canvas.height > 5000) {
        console.log('⚠️  Canvas size is too large! This is the bug.');
    }
} else {
    console.log('\n❌ Canvas not found');
}

// 3. Check container size
const container = document.querySelector('.graph-editor-canvas');
if (container) {
    const rect = container.getBoundingClientRect();
    console.log('\n✅ Container found:');
    console.log('   - Width:', rect.width);
    console.log('   - Height:', rect.height);
    console.log('   - Computed style:', window.getComputedStyle(container).display);
} else {
    console.log('\n❌ Container not found');
}

// 4. Fix function - run this if canvas is too large
window.fixCanvas = () => {
    const canvas = document.querySelector('.graph-editor-canvas canvas');
    const container = document.querySelector('.graph-editor-canvas');
    
    if (canvas && container) {
        const rect = container.getBoundingClientRect();
        
        // Force resize
        canvas.width = rect.width;
        canvas.height = rect.height;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        
        console.log('✅ Canvas resized to:', rect.width, 'x', rect.height);
        
        // Trigger network redraw
        const network = window.networkRef;
        if (network) {
            network.redraw();
            network.fit();
        }
    } else {
        console.log('❌ Canvas or container not found');
    }
};

// 5. Create sample data function
window.createSampleData = () => {
    const sampleData = {
        courses: [
            { course_id: 1, course_code: 'IT3190', course_name: 'Đồ án thiết kế hệ thống', rank: 1 },
            { course_id: 2, course_code: 'IT4785', course_name: 'Lập trình Android', rank: 2 },
            { course_id: 3, course_code: 'IT4788', course_name: 'Phát triển ứng dụng di động', rank: 3 }
        ],
        enrolledCourses: [
            { course_id: 101, course_code: 'IT3080', course_name: 'Mạng máy tính' },
            { course_id: 102, course_code: 'IT3090', course_name: 'Cơ sở dữ liệu' }
        ],
        graphType: 'profile-based'
    };
    
    sessionStorage.setItem('graphEditorData', JSON.stringify(sampleData));
    console.log('✅ Sample data created in sessionStorage');
    console.log('   Reload page to test with this data');
    
    return sampleData;
};

console.log('\n📝 Available commands:');
console.log('   fixCanvas()         - Fix canvas size issue');
console.log('   createSampleData()  - Create test data');
console.log('\nExample: Run fixCanvas() if canvas is too large');
