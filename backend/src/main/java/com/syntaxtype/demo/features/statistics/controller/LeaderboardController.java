package com.syntaxtype.demo.features.statistics.controller;

import com.syntaxtype.demo.features.statistics.dto.LeaderboardDTO;
import com.syntaxtype.demo.features.statistics.dto.LeaderboardEntry;
import com.syntaxtype.demo.features.user.entity.User;
import com.syntaxtype.demo.core.enums.Category;
import com.syntaxtype.demo.features.statistics.service.LeaderboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/leaderboards")
@RequiredArgsConstructor
public class LeaderboardController {
    private final LeaderboardService leaderboardService;

    // ============ Public Leaderboard Display Endpoints ============

    /**
     * Get global top 10 leaderboard across all categories.
     * Shows each user's best entry for the specified metric.
     * 
     * @param metric The metric to rank by: wpm, accuracy, or combined (default)
     * @param page The page number (offset pagination, default 0)
     * @return List of top 10 LeaderboardEntry with ranks
     */
    @Cacheable(value = "leaderboard", key = "'global:' + #metric + ':' + #page", unless = "#result == null")
    @GetMapping("/global")
    public ResponseEntity<List<LeaderboardEntry>> getGlobalLeaderboard(
            @RequestParam(defaultValue = "combined") String metric,
            @RequestParam(defaultValue = "0") int page) {
        return ResponseEntity.ok(leaderboardService.getGlobalTop10(metric));
    }

    /**
     * Get top 10 leaderboard for a specific category.
     * 
     * @param category The game category
     * @param metric The metric to rank by: wpm, accuracy, or combined (default)
     * @return List of top 10 LeaderboardEntry with ranks
     */
    @Cacheable(value = "leaderboard", key = "'game:' + #category + ':' + #metric", unless = "#result == null")
    @GetMapping("/game/{category}")
    public ResponseEntity<List<LeaderboardEntry>> getGameLeaderboard(
            @PathVariable Category category,
            @RequestParam(defaultValue = "combined") String metric) {

        // Score-based (non-typing) games submit no WPM, so WPM/combined ranking
        // would tie everyone at zero — rank them by their raw game score instead,
        // regardless of the requested metric.
        if (!leaderboardService.isTypingCategory(category)) {
            return ResponseEntity.ok(leaderboardService.getTop10ByScore(category));
        }

        return switch (metric.toLowerCase()) {
            case "wpm" -> ResponseEntity.ok(leaderboardService.getTop10ByWpm(category));
            case "accuracy" -> ResponseEntity.ok(leaderboardService.getTop10ByAccuracy(category));
            default -> ResponseEntity.ok(leaderboardService.getTop10ByCombinedScore(category));
        };
    }

    /**
     * Get all rankings for a specific user across all categories.
     * Returns the user's position in each category leaderboard.
     * 
     * @param userId The user ID
     * @return List of LeaderboardEntry for all categories the user has played
     */
    @Cacheable(value = "leaderboard", key = "'user:' + #userId", unless = "#result == null")
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<LeaderboardEntry>> getUserRankings(@PathVariable Long userId) {
        return ResponseEntity.ok(leaderboardService.getUserRankings(userId));
    }

    // ============ Admin CRUD Endpoints ============

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @GetMapping
    public ResponseEntity<List<LeaderboardDTO>> getAllLeaderboards() {
        return ResponseEntity.ok(leaderboardService.findAll());
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @GetMapping("/{leaderboardId}")
    public ResponseEntity<Optional<LeaderboardDTO>> getById(@PathVariable Long leaderboardId) {
        return ResponseEntity.ok(leaderboardService.findByLeaderboardId(leaderboardId));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @GetMapping("/user")
    public ResponseEntity<Optional<LeaderboardDTO>> getByUser(@RequestBody User user) {
        return ResponseEntity.ok(leaderboardService.findByUser(user));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @GetMapping("/words-per-minute/{wpm}")
    public ResponseEntity<List<LeaderboardDTO>> getByWordsPerMinute(@PathVariable Integer wpm) {
        return ResponseEntity.ok(leaderboardService.findByWordsPerMinute(wpm));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @GetMapping("/accuracy/{accuracy}")
    public ResponseEntity<List<LeaderboardDTO>> getByAccuracy(@PathVariable Integer accuracy) {
        return ResponseEntity.ok(leaderboardService.findByAccuracy(accuracy));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @GetMapping("/total-words-typed/{totalWordsTyped}")
    public ResponseEntity<List<LeaderboardDTO>> getByTotalWordsTyped(@PathVariable Integer totalWordsTyped) {
        return ResponseEntity.ok(leaderboardService.findByTotalWordsTyped(totalWordsTyped));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @GetMapping("/total-time-spent/{totalTimeSpent}")
    public ResponseEntity<List<LeaderboardDTO>> getByTotalTimeSpent(@PathVariable Integer totalTimeSpent) {
        return ResponseEntity.ok(leaderboardService.findByTotalTimeSpent(totalTimeSpent));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @GetMapping("/category/{category}")
    public ResponseEntity<List<LeaderboardDTO>> getByCategory(@PathVariable Category category) {
        return ResponseEntity.ok(leaderboardService.findByCategory(category));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @PostMapping
    public ResponseEntity<LeaderboardDTO> createLeaderboard(@RequestBody LeaderboardDTO leaderboardDTO, @RequestParam Long userId) {
        User user = new User();
        user.setUserId(userId);
        return ResponseEntity.ok(leaderboardService.save(leaderboardDTO, user));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @PatchMapping("/{leaderboardId}/words-per-minute")
    public ResponseEntity<LeaderboardDTO> updateWordsPerMinute(@PathVariable Long leaderboardId, @RequestParam Integer newWpm) {
        LeaderboardDTO updated = leaderboardService.updateWordsPerMinute(leaderboardId, newWpm);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @PatchMapping("/{leaderboardId}/accuracy")
    public ResponseEntity<LeaderboardDTO> updateAccuracy(@PathVariable Long leaderboardId, @RequestParam Integer newAccuracy) {
        LeaderboardDTO updated = leaderboardService.updateAccuracy(leaderboardId, newAccuracy);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @PatchMapping("/{leaderboardId}/total-words-typed")
    public ResponseEntity<LeaderboardDTO> updateTotalWordsTyped(@PathVariable Long leaderboardId, @RequestParam Integer newTotalWordsTyped) {
        LeaderboardDTO updated = leaderboardService.updateTotalWordsTyped(leaderboardId, newTotalWordsTyped);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @PatchMapping("/{leaderboardId}/total-time-spent")
    public ResponseEntity<LeaderboardDTO> updateTotalTimeSpent(@PathVariable Long leaderboardId, @RequestParam Integer newTotalTimeSpent) {
        LeaderboardDTO updated = leaderboardService.updateTotalTimeSpent(leaderboardId, newTotalTimeSpent);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @PatchMapping("/{leaderboardId}/category")
    public ResponseEntity<LeaderboardDTO> updateCategory(@PathVariable Long leaderboardId, @RequestParam Category newCategory) {
        LeaderboardDTO updated = leaderboardService.updateCategory(leaderboardId, newCategory);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable Long id) {
        leaderboardService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
