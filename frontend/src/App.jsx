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
import GraphFullScreen from './pages/GraphFullScreen.jsx';
import GraphEditorPage from './pages/GraphEditorPage.jsx';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminModel from './pages/admin/AdminModel.jsx';

// (Tùy chọn) Component bảo vệ route
import AuthGuard from './components/Common/AuthGuard.jsx';
import AdminGuard from './components/common/AdminGuard.jsx';
import AdminDebug from './components/common/AdminDebug.jsx';

function App() {
    return (
        <>
            {/* Debug component - chỉ hiện trong development */}
            {/* <AdminDebug /> */}
            
            <Routes>
            {/* Graph fullscreen route - WITHOUT Layout */}
            <Route path="/graph-fullscreen" element={
                <AuthGuard>
                    <GraphFullScreen />
                </AuthGuard>
            } />
            
            {/* Graph editor route - WITHOUT Layout */}
            <Route path="/graph-editor" element={
                <AuthGuard>
                    <GraphEditorPage />
                </AuthGuard>
            } />
            
            {/* All other routes - WITH Layout */}
            <Route path="/*" element={
                <Layout>
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

                        {/* Admin Routes - Protected by AdminGuard */}
                        <Route path="/admin" element={
                            <AdminGuard>
                                <AdminDashboard />
                            </AdminGuard>
                        } />
                        <Route path="/admin/users" element={
                            <AdminGuard>
                                <AdminUsers />
                            </AdminGuard>
                        } />
                        <Route path="/admin/model" element={
                            <AdminGuard>
                                <AdminModel />
                            </AdminGuard>
                        } />
                        
                        {/* (Tùy chọn: Trang 404) */}
                        {/* <Route path="*" element={<NotFoundPage />} /> */}
                    </Routes>
                </Layout>
            } />
            </Routes>
        </>
    );
}

export default App;