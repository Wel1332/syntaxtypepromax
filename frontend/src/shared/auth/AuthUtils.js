// shared/auth/AuthUtils.js
import axios from 'axios';

const TOKEN_STORAGE_KEY = 'jwtToken';
const AUTH_CHANGE_EVENT = 'authChange';

export const setAuthToken = (token) => {
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
        delete axios.defaults.headers.common['Authorization'];
        localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
};

export const getAuthToken = () => {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
};

export const subscribeToAuthChanges = (callback) => {
    const handler = () => callback(!!getAuthToken());
    window.addEventListener(AUTH_CHANGE_EVENT, handler);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, handler);
};

// Initialize token on app load
const token = getAuthToken();
if (token) {
    setAuthToken(token);
}
