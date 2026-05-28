// App.js — thin shell. Real route table lives at app/routes.js.
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Navbar from './app/layout/Navbar';
import ProtectedRoute from './app/layout/ProtectedRoute';
import PublicOnlyRoute from './app/layout/PublicOnlyRoute';
import { routes } from './app/routes';

const renderRoute = (r) => {
    if (r.kind === 'redirect') {
        return <Route key={r.path} path={r.path} element={<Navigate to={r.redirect} replace />} />;
    }
    let element = r.element;
    if (r.kind === 'public-only') {
        element = <PublicOnlyRoute>{element}</PublicOnlyRoute>;
    } else if (r.kind === 'protected') {
        element = <ProtectedRoute allowedRoles={r.roles}>{element}</ProtectedRoute>;
    }
    return <Route key={r.path} path={r.path} element={element} />;
};

const App = () => (
    <Router>
        <Navbar />
        <Routes>{routes.map(renderRoute)}</Routes>
    </Router>
);

export default App;
