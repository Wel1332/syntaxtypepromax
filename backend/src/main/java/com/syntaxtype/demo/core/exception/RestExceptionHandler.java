package com.syntaxtype.demo.core.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Central API error handling.
 *
 * This exists so the app can return the deliberate, user-facing reasons carried
 * by {@link ResponseStatusException} (e.g. "You have already joined this class.")
 * without leaving {@code server.error.include-message=always} on, which also
 * echoed raw internal exception text — such as "User not found with ID: 42" — to
 * clients on a public API. {@code application.properties} now sets
 * {@code include-message=never}, so anything not handled here reaches the default
 * error response with no message and leaks no internal detail. Only the curated
 * messages below are returned; the frontend reads {@code body.message}.
 *
 * There is deliberately no {@code @ExceptionHandler(Exception.class)} catch-all:
 * it would also intercept Spring Security's {@code AccessDeniedException} thrown by
 * {@code @PreAuthorize} and could turn a 403 into whatever it returned. Letting
 * that exception propagate keeps the authorization boundary — and its 403 — intact.
 */
@RestControllerAdvice
public class RestExceptionHandler {

    /** Deliberate, safe-to-show reasons set by controllers and services. */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatus(ResponseStatusException ex) {
        return ResponseEntity.status(ex.getStatusCode()).body(body(ex.getStatusCode(), ex.getReason()));
    }

    /** Username collisions during registration or teacher setup are user-facing. */
    @ExceptionHandler(UsernameConflictException.class)
    public ResponseEntity<Map<String, Object>> handleUsernameConflict(UsernameConflictException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body(HttpStatus.CONFLICT, ex.getMessage()));
    }

    private Map<String, Object> body(HttpStatusCode status, String message) {
        HttpStatus resolved = HttpStatus.resolve(status.value());
        String phrase = resolved != null ? resolved.getReasonPhrase() : "";
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("timestamp", Instant.now().toString());
        m.put("status", status.value());
        m.put("error", phrase);
        // Use the curated reason when present; never fall back to an internal
        // message — a blank reason yields the generic status phrase instead.
        m.put("message", (message != null && !message.isBlank()) ? message : phrase);
        return m;
    }
}
