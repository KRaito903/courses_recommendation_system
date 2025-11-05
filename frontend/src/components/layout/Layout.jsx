// src/components/layout/Layout.jsx
import React from 'react';
import Navbar from './Navbar.jsx';

const Layout = ({ children }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <main style={{ 
                flex: 1, 
                maxWidth: '1200px', 
                width: '100%', 
                margin: '0 auto', 
                padding: '2rem 1rem' 
            }}>
                {children}
            </main>
            <footer style={{ 
                backgroundColor: 'var(--bg-white)', 
                padding: '2rem 1rem', 
                textAlign: 'center',
                borderTop: '1px solid var(--border-color)',
                marginTop: 'auto'
            }}>
                <p style={{ color: 'var(--text-light)', margin: 0 }}>
                    © 2025 Course Recommender System. All rights reserved.
                </p>
            </footer>
        </div>
    );
};

export default Layout;