package com.syntaxtype.demo.core.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;

    public JwtAuthFilter(JwtUtil jwtUtil, @Lazy CustomUserDetailsService userDetailsService) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        String username = null;
        String jwt = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            jwt = authHeader.substring(7);
            try {
                username = jwtUtil.extractUsername(jwt);
            } catch (Exception e) {
                System.err.println("JWT extraction failed: " + e.getMessage());
            }
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            if (jwtUtil.validateToken(jwt) && isCurrentPasswordVersion(jwt, userDetails)) {
                // 🟡 Extract the role from the token. Tokens store the bare enum
                // name (e.g. "STUDENT"), but Spring's hasRole/hasAnyRole checks
                // expect the "ROLE_" prefix. Normalize so @PreAuthorize matches.
                String role = jwtUtil.extractRole(jwt); // e.g., "STUDENT"
                String authority = (role != null && role.startsWith("ROLE_")) ? role : "ROLE_" + role;

                // 🟢 Set the authority explicitly from token
                List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(authority));

                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails, null, authorities
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        filterChain.doFilter(request, response);
    }

    /**
     * A password change bumps the user's password version, so any token minted
     * before it (another device, or a stolen copy) stops authenticating. Fails
     * closed if the principal is not ours, since then the version cannot be read.
     */
    private boolean isCurrentPasswordVersion(String jwt, UserDetails userDetails) {
        return userDetails instanceof CustomUserDetails details
                && jwtUtil.extractPasswordVersion(jwt) == details.getUser().getPasswordVersion();
    }

}