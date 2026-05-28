import React from 'react';
import { Navigate } from 'react-router-dom';
import { getAuthToken } from '../../shared/auth/AuthUtils';

const PublicOnlyRoute = ({ children }) => {
    const token = getAuthToken();

    if (token) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default PublicOnlyRoute;
