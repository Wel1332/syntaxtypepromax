// app/layout/ProtectedRoute.js
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { getAuthToken } from '../../shared/auth/AuthUtils';
import { getUserRole, getUserId, getIsTempPassword } from '../../shared/auth/JwtUtils';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [authStatus, setAuthStatus] = useState({
        isAuthenticated: false,
        isAuthorized: false,
        userRole: null,
        isStudentProfileComplete: true,
        isTempPassword: false,
        isTeacherProfileComplete: true,
    });

    const token = getAuthToken();
    const location = useLocation();

    useEffect(() => {
        setIsLoading(true);
        const checkAuthAndProfile = async () => {
            if (!token) {
                setAuthStatus({
                    isAuthenticated: false,
                    isAuthorized: false,
                    userRole: null,
                    isStudentProfileComplete: true,
                    isTempPassword: false,
                    isTeacherProfileComplete: true,
                })
                setIsLoading(false);
                return;
            }

            const currentUserId = getUserId(token);
            const currentUserRole = getUserRole(token);
            const isTemporaryPassword = getIsTempPassword(token);

            const authorized = !allowedRoles || allowedRoles.length === 0 || (currentUserRole && allowedRoles.includes(currentUserRole));
            let studentProfileComplete = true;
            let teacherProfileComplete = true;

            if (authorized && currentUserRole === 'STUDENT' && currentUserId) {
                try {
                    const studentDetailsResponse = await axios.get(`/api/students/user/${currentUserId}`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                    if (!studentDetailsResponse.data || Object.keys(studentDetailsResponse.data).length === 0) {
                        studentProfileComplete = false;
                    } else {
                        studentProfileComplete = true;
                    }
                } catch (error) {
                    if (error.response && error.response.status === 404) {
                        studentProfileComplete = false;
                    } else {
                        console.error('Error checking student profile:', error);
                        studentProfileComplete = true;
                    }
                }
            } else if (authorized && currentUserRole === 'TEACHER' && currentUserId && !isTemporaryPassword) {
                try {
                    const teacherDetailsResponse = await axios.get(`/api/teachers/user/${currentUserId}`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                    if (!teacherDetailsResponse.data || Object.keys(teacherDetailsResponse.data).length === 0) {
                        teacherProfileComplete = false;
                    } else {
                        teacherProfileComplete = true;
                    }
                } catch (error) {
                    if (error.response && error.response.status === 404) {
                        teacherProfileComplete = false;
                    } else {
                        console.error('Error checking teacher profile:', error);
                        teacherProfileComplete = true;
                    }
                }
            }

            setAuthStatus({
                isAuthenticated: true,
                isAuthorized: authorized,
                userRole: currentUserRole,
                isStudentProfileComplete: studentProfileComplete,
                isTempPassword: isTemporaryPassword,
                isTeacherProfileComplete: teacherProfileComplete,
            });
            setIsLoading(false);
        };

        checkAuthAndProfile();
    }, [token, allowedRoles]);

    if (isLoading) {
        return <div>Loading authentication...</div>;
    }

    if (!authStatus.isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!authStatus.isAuthorized) {
        return <Navigate to="/unauthorized" replace />;
    }

    // TEACHER ACCOUNT SETUP CHECK
    if (authStatus.userRole === 'TEACHER') {
        if (authStatus.isTempPassword) {
            if (location.pathname !== '/teacher-setup-account') {
                return <Navigate to="/teacher-setup-account" replace state={{ from: location }} />;
            }
        } else {
            if (location.pathname === '/teacher-setup-account') {
                const fromPath = location.state?.from?.pathname;
                const redirectTo = (fromPath && fromPath !== '/teacher-setup-account') ? fromPath : '/dashboard';
                return <Navigate to={redirectTo} replace />;
            }
        }
    }

    // STUDENT PROFILE CHECK
    if (
        authStatus.userRole === 'STUDENT' &&
        authStatus.isStudentProfileComplete &&
        location.pathname === '/student-details-form'
    ) {
        const fromPath = location.state?.from?.pathname;
        const redirectTo = (fromPath && fromPath !== '/student-details-form') ? fromPath : '/dashboard';
        return <Navigate to={redirectTo} replace />;
    }

    if (
        authStatus.userRole === 'STUDENT' &&
        !authStatus.isStudentProfileComplete &&
        location.pathname !== '/student-details-form'
    ) {
        return <Navigate to="/student-details-form" replace state={{ from: location }} />;
    }

    // TEACHER PROFILE CHECK
    if (authStatus.userRole === 'TEACHER' && !authStatus.isTempPassword) {
        if (
            authStatus.userRole === 'TEACHER' &&
            authStatus.isTeacherProfileComplete &&
            location.pathname === '/teacher-details-form'
        ) {
            const fromPath = location.state?.from?.pathname;
            const redirectTo = (fromPath && fromPath !== '/teacher-details-form') ? fromPath : '/dashboard';
            return <Navigate to={redirectTo} replace />;
        }

        if (
            authStatus.userRole === 'TEACHER' &&
            !authStatus.isTeacherProfileComplete &&
            location.pathname !== '/teacher-details-form'
        ) {
            return <Navigate to="/teacher-details-form" replace state={{ from: location }} />;
        }
    }

    return children;
};

export default ProtectedRoute;
