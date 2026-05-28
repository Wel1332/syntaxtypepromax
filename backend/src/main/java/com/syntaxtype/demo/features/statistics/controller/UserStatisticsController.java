package com.syntaxtype.demo.features.statistics.controller;

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

@RestController
@RequestMapping("/api/user-statistics")
@RequiredArgsConstructor
public class UserStatisticsController {
    private final UserStatisticsService userStatisticsService;

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @GetMapping
    public ResponseEntity<List<UserStatisticsDTO>> getAllUserStatistics() {
        return ResponseEntity.ok(userStatisticsService.findAll());
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @GetMapping("/user")
    public ResponseEntity<Optional<UserStatisticsDTO>> getByUser(@RequestParam Long userId) {
        User user = new User();
        user.setUserId(userId);
        return ResponseEntity.ok(userStatisticsService.findByUser(user));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @GetMapping("/words-per-minute/{wpm}")
    public ResponseEntity<List<UserStatisticsDTO>> getByWordsPerMinute(@PathVariable Integer wpm) {
        return ResponseEntity.ok(userStatisticsService.findByWordsPerMinute(wpm));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @GetMapping("/accuracy/{accuracy}")
    public ResponseEntity<List<UserStatisticsDTO>> getByAccuracy(@PathVariable Integer accuracy) {
        return ResponseEntity.ok(userStatisticsService.findByAccuracy(accuracy));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @GetMapping("/total-words-typed/{totalWordsTyped}")
    public ResponseEntity<List<UserStatisticsDTO>> getByTotalWordsTyped(@PathVariable Integer totalWordsTyped) {
        return ResponseEntity.ok(userStatisticsService.findByTotalWordsTyped(totalWordsTyped));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @GetMapping("/total-time-spent/{totalTimeSpent}")
    public ResponseEntity<List<UserStatisticsDTO>> getByTotalTimeSpent(@PathVariable Integer totalTimeSpent) {
        return ResponseEntity.ok(userStatisticsService.findByTotalTimeSpent(totalTimeSpent));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @GetMapping("/total-errors/{totalErrors}")
    public ResponseEntity<List<UserStatisticsDTO>> getByTotalErrors(@PathVariable Integer totalErrors) {
        return ResponseEntity.ok(userStatisticsService.findByTotalErrors(totalErrors));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @GetMapping("/total-tests-taken/{totalTestsTaken}")
    public ResponseEntity<List<UserStatisticsDTO>> getByTotalTestsTaken(@PathVariable Integer totalTestsTaken) {
        return ResponseEntity.ok(userStatisticsService.findByTotalTestsTaken(totalTestsTaken));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @GetMapping("/fastest-clear-time/{fastestClearTime}")
    public ResponseEntity<List<UserStatisticsDTO>> getByFastestClearTime(@PathVariable Integer fastestClearTime) {
        return ResponseEntity.ok(userStatisticsService.findByFastestClearTime(fastestClearTime));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @GetMapping("/{id}")
    public ResponseEntity<Optional<UserStatisticsDTO>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(userStatisticsService.findById(id));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @PostMapping
    public ResponseEntity<UserStatisticsDTO> createUserStatistics(@RequestBody UserStatisticsDTO userStatisticsDTO, @RequestParam Long userId) {
        User user = new User();
        user.setUserId(userId);
        return ResponseEntity.ok(userStatisticsService.save(userStatisticsDTO, user));
    }

    // PATCH: Update user
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @PatchMapping("/{userStatisticsId}/user")
    public ResponseEntity<UserStatisticsDTO> updateUser(@PathVariable Long userStatisticsId, @RequestBody User user) {
        UserStatisticsDTO updated = userStatisticsService.updateUser(userStatisticsId, user);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    // PATCH: Update words per minute
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @PatchMapping("/{userStatisticsId}/words-per-minute")
    public ResponseEntity<UserStatisticsDTO> updateWordsPerMinute(@PathVariable Long userStatisticsId, @RequestParam Integer newWpm) {
        UserStatisticsDTO updated = userStatisticsService.updateWordsPerMinute(userStatisticsId, newWpm);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    // PATCH: Update accuracy
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @PatchMapping("/{userStatisticsId}/accuracy")
    public ResponseEntity<UserStatisticsDTO> updateAccuracy(@PathVariable Long userStatisticsId, @RequestParam Integer newAccuracy) {
        UserStatisticsDTO updated = userStatisticsService.updateAccuracy(userStatisticsId, newAccuracy);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    // PATCH: Update total words typed
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @PatchMapping("/{userStatisticsId}/total-words-typed")
    public ResponseEntity<UserStatisticsDTO> updateTotalWordsTyped(@PathVariable Long userStatisticsId, @RequestParam Integer newTotalWordsTyped) {
        UserStatisticsDTO updated = userStatisticsService.updateTotalWordsTyped(userStatisticsId, newTotalWordsTyped);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    // PATCH: Update total time spent
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @PatchMapping("/{userStatisticsId}/total-time-spent")
    public ResponseEntity<UserStatisticsDTO> updateTotalTimeSpent(@PathVariable Long userStatisticsId, @RequestParam Integer newTotalTimeSpent) {
        UserStatisticsDTO updated = userStatisticsService.updateTotalTimeSpent(userStatisticsId, newTotalTimeSpent);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    // PATCH: Update total errors
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @PatchMapping("/{userStatisticsId}/total-errors")
    public ResponseEntity<UserStatisticsDTO> updateTotalErrors(@PathVariable Long userStatisticsId, @RequestParam Integer newTotalErrors) {
        UserStatisticsDTO updated = userStatisticsService.updateTotalErrors(userStatisticsId, newTotalErrors);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    // PATCH: Update total tests taken
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @PatchMapping("/{userStatisticsId}/total-tests-taken")
    public ResponseEntity<UserStatisticsDTO> updateTotalTestsTaken(@PathVariable Long userStatisticsId, @RequestParam Integer newTotalTestsTaken) {
        UserStatisticsDTO updated = userStatisticsService.updateTotalTestsTaken(userStatisticsId, newTotalTestsTaken);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    // PATCH: Update fastest clear time
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @PatchMapping("/{userStatisticsId}/fastest-clear-time")
    public ResponseEntity<UserStatisticsDTO> updateFastestClearTime(@PathVariable Long userStatisticsId, @RequestParam Integer newFastestClearTime) {
        UserStatisticsDTO updated = userStatisticsService.updateFastestClearTime(userStatisticsId, newFastestClearTime);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
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
