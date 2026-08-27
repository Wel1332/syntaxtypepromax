package com.syntaxtype.demo.features.statistics.controller;

import com.syntaxtype.demo.core.security.AccessGuard;
import com.syntaxtype.demo.core.security.CustomUserDetails;
import com.syntaxtype.demo.features.statistics.dto.UserStatisticsDTO;
import com.syntaxtype.demo.features.user.entity.User;
import com.syntaxtype.demo.features.statistics.service.UserStatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * These rows hold the exact numbers the validation study measures — words per minute,
 * accuracy, tests taken. Every write endpoint here was open to STUDENT and USER, so a
 * participant could PATCH their own WPM to any value with a single request, and the
 * enumeration reads exposed every other participant's figures.
 *
 * Statistics are maintained server-side by UserStatisticsService.recordSession, which
 * ScoreController calls on each submission. Nothing in the app needs a client to write them,
 * so the writes are admin-only and exist purely for administrative correction.
 */
@RestController
@RequestMapping("/api/user-statistics")
@RequiredArgsConstructor
public class UserStatisticsController {
    private final UserStatisticsService userStatisticsService;

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping
    public ResponseEntity<List<UserStatisticsDTO>> getAllUserStatistics() {
        return ResponseEntity.ok(userStatisticsService.findAll());
    }

    /**
     * Staff read any user's statistics — the teacher and admin dashboards aggregate the
     * class this way. Everyone else reads only their own.
     */
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @GetMapping("/user")
    public ResponseEntity<Optional<UserStatisticsDTO>> getByUser(
            @RequestParam Long userId,
            @AuthenticationPrincipal CustomUserDetails caller) {
        AccessGuard.requireSelfOrStaff(userId, caller, "statistics");
        User user = new User();
        user.setUserId(userId);
        return ResponseEntity.ok(userStatisticsService.findByUser(user));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping("/words-per-minute/{wpm}")
    public ResponseEntity<List<UserStatisticsDTO>> getByWordsPerMinute(@PathVariable Integer wpm) {
        return ResponseEntity.ok(userStatisticsService.findByWordsPerMinute(wpm));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping("/accuracy/{accuracy}")
    public ResponseEntity<List<UserStatisticsDTO>> getByAccuracy(@PathVariable Integer accuracy) {
        return ResponseEntity.ok(userStatisticsService.findByAccuracy(accuracy));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping("/total-words-typed/{totalWordsTyped}")
    public ResponseEntity<List<UserStatisticsDTO>> getByTotalWordsTyped(@PathVariable Integer totalWordsTyped) {
        return ResponseEntity.ok(userStatisticsService.findByTotalWordsTyped(totalWordsTyped));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping("/total-time-spent/{totalTimeSpent}")
    public ResponseEntity<List<UserStatisticsDTO>> getByTotalTimeSpent(@PathVariable Integer totalTimeSpent) {
        return ResponseEntity.ok(userStatisticsService.findByTotalTimeSpent(totalTimeSpent));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping("/total-errors/{totalErrors}")
    public ResponseEntity<List<UserStatisticsDTO>> getByTotalErrors(@PathVariable Integer totalErrors) {
        return ResponseEntity.ok(userStatisticsService.findByTotalErrors(totalErrors));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping("/total-tests-taken/{totalTestsTaken}")
    public ResponseEntity<List<UserStatisticsDTO>> getByTotalTestsTaken(@PathVariable Integer totalTestsTaken) {
        return ResponseEntity.ok(userStatisticsService.findByTotalTestsTaken(totalTestsTaken));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping("/fastest-clear-time/{fastestClearTime}")
    public ResponseEntity<List<UserStatisticsDTO>> getByFastestClearTime(@PathVariable Integer fastestClearTime) {
        return ResponseEntity.ok(userStatisticsService.findByFastestClearTime(fastestClearTime));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping("/{id}")
    public ResponseEntity<Optional<UserStatisticsDTO>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(userStatisticsService.findById(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<UserStatisticsDTO> createUserStatistics(@RequestBody UserStatisticsDTO userStatisticsDTO, @RequestParam Long userId) {
        User user = new User();
        user.setUserId(userId);
        return ResponseEntity.ok(userStatisticsService.save(userStatisticsDTO, user));
    }

    // PATCH: Update user
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{userStatisticsId}/user")
    public ResponseEntity<UserStatisticsDTO> updateUser(@PathVariable Long userStatisticsId, @RequestBody User user) {
        UserStatisticsDTO updated = userStatisticsService.updateUser(userStatisticsId, user);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    // PATCH: Update words per minute
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{userStatisticsId}/words-per-minute")
    public ResponseEntity<UserStatisticsDTO> updateWordsPerMinute(@PathVariable Long userStatisticsId, @RequestParam Integer newWpm) {
        UserStatisticsDTO updated = userStatisticsService.updateWordsPerMinute(userStatisticsId, newWpm);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    // PATCH: Update accuracy
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{userStatisticsId}/accuracy")
    public ResponseEntity<UserStatisticsDTO> updateAccuracy(@PathVariable Long userStatisticsId, @RequestParam Integer newAccuracy) {
        UserStatisticsDTO updated = userStatisticsService.updateAccuracy(userStatisticsId, newAccuracy);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    // PATCH: Update total words typed
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{userStatisticsId}/total-words-typed")
    public ResponseEntity<UserStatisticsDTO> updateTotalWordsTyped(@PathVariable Long userStatisticsId, @RequestParam Integer newTotalWordsTyped) {
        UserStatisticsDTO updated = userStatisticsService.updateTotalWordsTyped(userStatisticsId, newTotalWordsTyped);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    // PATCH: Update total time spent
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{userStatisticsId}/total-time-spent")
    public ResponseEntity<UserStatisticsDTO> updateTotalTimeSpent(@PathVariable Long userStatisticsId, @RequestParam Integer newTotalTimeSpent) {
        UserStatisticsDTO updated = userStatisticsService.updateTotalTimeSpent(userStatisticsId, newTotalTimeSpent);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    // PATCH: Update total errors
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{userStatisticsId}/total-errors")
    public ResponseEntity<UserStatisticsDTO> updateTotalErrors(@PathVariable Long userStatisticsId, @RequestParam Integer newTotalErrors) {
        UserStatisticsDTO updated = userStatisticsService.updateTotalErrors(userStatisticsId, newTotalErrors);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    // PATCH: Update total tests taken
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{userStatisticsId}/total-tests-taken")
    public ResponseEntity<UserStatisticsDTO> updateTotalTestsTaken(@PathVariable Long userStatisticsId, @RequestParam Integer newTotalTestsTaken) {
        UserStatisticsDTO updated = userStatisticsService.updateTotalTestsTaken(userStatisticsId, newTotalTestsTaken);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    // PATCH: Update fastest clear time
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{userStatisticsId}/fastest-clear-time")
    public ResponseEntity<UserStatisticsDTO> updateFastestClearTime(@PathVariable Long userStatisticsId, @RequestParam Integer newFastestClearTime) {
        UserStatisticsDTO updated = userStatisticsService.updateFastestClearTime(userStatisticsId, newFastestClearTime);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable Long id) {
        userStatisticsService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/lesson/{lessonId}")
    public UserStatisticsDTO getStatisticsByLesson(
            @PathVariable Long lessonId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long userId = userDetails.getUser().getUserId();
        return userStatisticsService.getStatisticsForUserAndLesson(userId, lessonId);
    }
}
