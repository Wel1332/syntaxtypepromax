// App.js — thin shell. Real route table lives at app/routes.js.
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

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

/**
 * The landing page ships its own header.
 *
 * It is a dark marketing surface regardless of the theme toggle, while this
 * AppBar follows the theme — and the theme defaults to light. Rendering both
 * put a cream bar above a near-black page for every first-time visitor, on top
 * of showing two navigations at once.
 */
const ChromeForRoute = () => (useLocation().pathname === '/' ? null : <Navbar />);

const App = () => (
    <Router>
        <ChromeForRoute />
        <Routes>{routes.map(renderRoute)}</Routes>
    </Router>
);

export default App;
