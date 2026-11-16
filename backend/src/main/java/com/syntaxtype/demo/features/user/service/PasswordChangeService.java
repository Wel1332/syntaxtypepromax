package com.syntaxtype.demo.features.user.service;

import com.syntaxtype.demo.core.security.JwtUtil;
import com.syntaxtype.demo.core.security.LoginAttemptService;
import com.syntaxtype.demo.features.user.dto.requests.ChangePasswordRequest;
import com.syntaxtype.demo.features.user.entity.User;
import com.syntaxtype.demo.features.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;

/**
 * Lets a signed-in user change their own password.
 *
 * Kept apart from UserService on purpose: it needs the login throttle, and adding
 * that to UserService would change a constructor other code and tests build by hand.
 */
@Service
@RequiredArgsConstructor
public class PasswordChangeService {

    static final int MIN_LENGTH = 8;

    // bcrypt only reads the first 72 bytes, and Spring Security rejects anything
    // longer with an IllegalArgumentException, which would surface as a 500.
    static final int MAX_BYTES = 72;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final LoginAttemptService loginAttemptService;

    /**
     * Changes the password and returns a fresh token for the caller.
     *
     * Wrong current passwords count against the same per-account counter as login,
     * keyed by email, so a stolen token gets no extra guesses here. Bumping the
     * password version ends every other session; the returned token carries the new
     * version, so the caller stays signed in.
     */
    @Transactional
    public String changeOwnPassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        String account = user.getEmail();

        if (loginAttemptService.isBlocked(account)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Too many failed attempts for this account. Please wait a few minutes and try again.");
        }

        String newPassword = request.getNewPassword();
        validateNewPassword(newPassword);

        String currentPassword = request.getCurrentPassword();
        if (currentPassword == null || !passwordEncoder.matches(currentPassword, user.getPassword())) {
            loginAttemptService.loginFailed(account);
            throw badRequest("Current password is incorrect.");
        }
        loginAttemptService.loginSucceeded(account);

        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw badRequest("New password must be different from the current one.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setPasswordVersion(user.getPasswordVersion() + 1);
        return jwtUtil.generateToken(userRepository.save(user));
    }

    private static void validateNewPassword(String newPassword) {
        if (newPassword == null || newPassword.isEmpty()) {
            throw badRequest("New password is required.");
        }
        if (newPassword.codePointCount(0, newPassword.length()) < MIN_LENGTH) {
            throw badRequest("New password must be at least " + MIN_LENGTH + " characters.");
        }
        if (newPassword.getBytes(StandardCharsets.UTF_8).length > MAX_BYTES) {
            throw badRequest("New password must be at most " + MAX_BYTES + " bytes.");
        }
    }

    private static ResponseStatusException badRequest(String reason) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, reason);
    }
}
