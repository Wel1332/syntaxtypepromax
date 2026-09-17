package com.syntaxtype.demo.core.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Throttles password guessing against a single account.
 *
 * Keyed by login identifier (email), not by client IP, on purpose: the backend
 * sits behind a Cloudflare tunnel — every request arrives from localhost — and
 * students share one school NAT, so an IP key would drop the whole class into
 * one bucket and lock everyone out at the start of a session. Keying on the
 * account being targeted throttles a brute-force run against one email while a
 * class logging into their own distinct accounts is unaffected. The trade-off is
 * that someone can deliberately lock one known account for the window; for a
 * classroom study that is acceptable and far better than an unthrottled login.
 *
 * Failures live in a Caffeine cache that expires each entry a fixed window after
 * its first failure, so a locked account frees itself with no scheduler. A
 * successful login clears the counter at once. State is in-memory and
 * per-instance, which is enough here: the study runs against one backend at a
 * time, and a cross-instance miss only grants a few extra attempts — it never
 * bypasses authentication itself.
 */
@Service
public class LoginAttemptService {

    /** Failed attempts allowed against one account before it is blocked for the window. */
    static final int MAX_ATTEMPTS = 10;
    private static final Duration WINDOW = Duration.ofMinutes(15);

    private final Cache<String, AtomicInteger> failuresByAccount;

    public LoginAttemptService() {
        this(WINDOW);
    }

    /** Package-visible so tests can use a short window. */
    LoginAttemptService(Duration window) {
        this.failuresByAccount = Caffeine.newBuilder()
                .expireAfterWrite(window)
                .maximumSize(10_000)
                .build();
    }

    private static String key(String identifier) {
        return identifier == null ? "" : identifier.trim().toLowerCase();
    }

    /** True once an account has reached the failure ceiling within the window. */
    public boolean isBlocked(String identifier) {
        if (identifier == null || identifier.isBlank()) return false;
        AtomicInteger count = failuresByAccount.getIfPresent(key(identifier));
        return count != null && count.get() >= MAX_ATTEMPTS;
    }

    /** Record one failed login against the account. */
    public void loginFailed(String identifier) {
        if (identifier == null || identifier.isBlank()) return;
        failuresByAccount.get(key(identifier), k -> new AtomicInteger(0)).incrementAndGet();
    }

    /** Clear the counter after a successful login. */
    public void loginSucceeded(String identifier) {
        if (identifier == null || identifier.isBlank()) return;
        failuresByAccount.invalidate(key(identifier));
    }
}
