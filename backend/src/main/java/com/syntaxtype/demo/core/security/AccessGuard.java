package com.syntaxtype.demo.core.security;

import com.syntaxtype.demo.core.enums.Role;
import com.syntaxtype.demo.features.user.entity.User;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * Ownership checks for endpoints that take a row id straight from the URL or a query
 * parameter.
 *
 * A {@code @PreAuthorize} role check proves the caller holds a role — never that the row
 * they named belongs to them. Several controllers here were copy-pasted from one that only
 * did the role check, so the same gap appeared in six places at once. Keeping the check in
 * one place is what stops it spreading a seventh time.
 *
 * Student.studentId and Teacher.teacherId are both {@code @MapsId} onto User.userId, so a
 * profile row's id and its owner's user id are the same value and compare directly, with no
 * repository lookup needed to establish ownership.
 */
public final class AccessGuard {

    private AccessGuard() {
    }

    public static User requireAuthenticated(CustomUserDetails caller) {
        if (caller == null || caller.getUser() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated.");
        }
        return caller.getUser();
    }

    public static boolean isAdmin(User user) {
        return user.getUserRole() == Role.ADMIN;
    }

    /** Admins and teachers both act across students; students act only on themselves. */
    public static boolean isStaff(User user) {
        return user.getUserRole() == Role.ADMIN || user.getUserRole() == Role.TEACHER;
    }

    /**
     * Admins may act on any row; everyone else only on their own.
     *
     * @param what noun used in the error message, e.g. "student profile"
     */
    public static void requireSelfOrAdmin(Long ownerId, CustomUserDetails caller, String what) {
        User user = requireAuthenticated(caller);
        if (!isAdmin(user) && !user.getUserId().equals(ownerId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "You may only act on your own " + what + ".");
        }
    }

    /** Staff may read any row; everyone else only their own. */
    public static void requireSelfOrStaff(Long ownerId, CustomUserDetails caller, String what) {
        User user = requireAuthenticated(caller);
        if (!isStaff(user) && !user.getUserId().equals(ownerId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "You may only read your own " + what + ".");
        }
    }
}
