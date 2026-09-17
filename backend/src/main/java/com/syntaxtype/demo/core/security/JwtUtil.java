package com.syntaxtype.demo.core.security;

import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtil {
    @Value("${jwt.secret}")
    private String SECRET_KEY;

    // Token lifetime in milliseconds. Read from the jwt.expiration property
    // (override with the JWT_EXPIRATION env var) instead of a hardcoded constant,
    // which had frozen every token at 24h and left jwt.expiration dead config.
    // Default 12h: there is no refresh-token flow, so the token must outlast a
    // full classroom session (pre-test + practice + post-test) or students get
    // logged out mid-study; 12h covers a school day while halving the old 24h
    // window a stolen token stays valid. Set JWT_EXPIRATION lower once a refresh
    // flow exists.
    @Value("${jwt.expiration:43200000}")
    private long expirationMs;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
    }

    public String generateToken(String username, String role, Long userId, boolean isTempPassword) {
        return Jwts.builder()
                .subject(username)
                .claim("role", role)
                .claim("id", userId)
                .claim("isTempPassword", isTempPassword) // Add the isTempPassword claim
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Validates the given JWT token.
     * @param token The JWT token string.
     * @return true if the token is valid and not expired, false otherwise.
     */
    public boolean validateToken(String token) {
        try {
            // Parse and verify the token. If successful, it's valid.
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            // Also check if the token is expired after successful parsing
            return !isTokenExpired(token);
        } catch (JwtException | IllegalArgumentException e) {
            // Log the exception for debugging purposes
            System.err.println("Invalid JWT token: " + e.getMessage());
            return false; // Token is invalid
        }
    }

    public Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractUsername(String token) {
        return extractClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return (String) extractClaims(token).get("role");
    }

    public boolean isTokenExpired(String token) {
        return extractClaims(token).getExpiration().before(new Date());
    }
}
