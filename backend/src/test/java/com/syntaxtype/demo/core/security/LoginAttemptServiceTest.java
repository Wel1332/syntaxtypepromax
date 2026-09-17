package com.syntaxtype.demo.core.security;

import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LoginAttemptServiceTest {

    private LoginAttemptService newService() {
        return new LoginAttemptService(Duration.ofMinutes(15));
    }

    @Test
    void blocksOnlyAfterReachingTheCeiling() {
        LoginAttemptService svc = newService();
        String email = "victim@example.com";

        for (int i = 0; i < LoginAttemptService.MAX_ATTEMPTS - 1; i++) {
            svc.loginFailed(email);
            assertFalse(svc.isBlocked(email), "must not block before the ceiling");
        }
        svc.loginFailed(email); // reaches MAX_ATTEMPTS
        assertTrue(svc.isBlocked(email), "must block once the ceiling is reached");
    }

    @Test
    void successClearsTheCounter() {
        LoginAttemptService svc = newService();
        String email = "student@example.com";

        for (int i = 0; i < LoginAttemptService.MAX_ATTEMPTS; i++) svc.loginFailed(email);
        assertTrue(svc.isBlocked(email));

        svc.loginSucceeded(email);
        assertFalse(svc.isBlocked(email), "a successful login resets the account");
    }

    @Test
    void differentAccountsAreIndependent() {
        LoginAttemptService svc = newService();
        for (int i = 0; i < LoginAttemptService.MAX_ATTEMPTS; i++) svc.loginFailed("a@example.com");

        assertTrue(svc.isBlocked("a@example.com"));
        assertFalse(svc.isBlocked("b@example.com"),
                "a class logging into distinct accounts must be unaffected by one account's lockout");
    }

    @Test
    void identifierIsCaseAndWhitespaceInsensitive() {
        LoginAttemptService svc = newService();
        for (int i = 0; i < LoginAttemptService.MAX_ATTEMPTS; i++) svc.loginFailed("  User@Example.com ");

        assertTrue(svc.isBlocked("user@example.com"),
                "the same account differing only in case or spacing shares one bucket");
    }

    @Test
    void nullOrBlankIdentifierIsNeverCountedOrBlocked() {
        LoginAttemptService svc = newService();
        svc.loginFailed(null);
        svc.loginFailed("");
        svc.loginFailed("   ");

        assertFalse(svc.isBlocked(null));
        assertFalse(svc.isBlocked(""));
        assertFalse(svc.isBlocked("   "));
    }
}
