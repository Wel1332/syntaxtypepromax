// shared/auth/JwtUtils.js
import { jwtDecode } from 'jwt-decode';
import { setAuthToken } from './AuthUtils';

export const decodeJwt = (token) => {
    try {
        return jwtDecode(token);
    } catch (error) {
        console.error("Error decoding JWT:", error);
        return null;
    }
};

const handleTokenValidation = (token) => {
    if (!token) return null;

    const decoded = decodeJwt(token);

    if (!decoded) {
        console.warn("Malformed JWT token detected. Logging out.");
        setAuthToken(null);
        return null;
    }

    if (typeof decoded.exp === 'undefined') {
        console.warn("JWT token is missing the 'exp' (expiration) claim. Logging out.");
        setAuthToken(null);
        return null;
    }

    const currentTimeInSeconds = Date.now() / 1000;
    if (decoded.exp < currentTimeInSeconds) {
        console.warn("JWT token has expired. Logging out.");
        setAuthToken(null);
        return null;
    }

    return decoded;
};

export const getUserRole = (token) => {
    const decodedToken = decodeJwt(token);
    return decodedToken ? decodedToken.role : null;
};

export const getUserId = (token) => {
    const decodedToken = decodeJwt(token);
    return decodedToken ? decodedToken.id : null;
};

export const getUsername = (token) => {
    const decodedToken = decodeJwt(token);
    return decodedToken ? decodedToken.sub : null;
};

export const getIsTempPassword = (token) => {
    const decodedToken = decodeJwt(token);
    return decodedToken ? decodedToken.isTempPassword === true : false;
};
