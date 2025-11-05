// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout.jsx';

// Import các trang
import HomePage from './pages/HomePage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import CoursesPage from './pages/CoursesPage.jsx';
import RecommendationsPage from './pages/RecommendationsPage.jsx';
import ContactPage from './pages/ContactPage.jsx';

// (Tùy chọn) Component bảo vệ route
import AuthGuard from './components/Common/AuthGuard.jsx';

function App() {
    return (
        <Layout> {/* Layout bọc tất cả các Routes */}
            <Routes>
                {/* Routes công khai */}
                <Route path="/" element={<HomePage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/contact" element={<ContactPage />} />

                {/* Routes cần đăng nhập (Dùng AuthGuard) */}
                <Route path="/profile" element={
                    <AuthGuard>
                        <ProfilePage />
                    </AuthGuard>
                } />
                <Route path="/courses" element={
                    <AuthGuard>
                        <CoursesPage />
                    </AuthGuard>
                } />
                <Route path="/recommendations" element={
                    <AuthGuard>
                        <RecommendationsPage />
                    </AuthGuard>
                } />
                
                {/* (Tùy chọn: Trang 404) */}
                {/* <Route path="*" element={<NotFoundPage />} /> */}
            </Routes>
        </Layout>
    );
}

export default App;