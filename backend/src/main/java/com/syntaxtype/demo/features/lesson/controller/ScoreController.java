package com.syntaxtype.demo.features.lesson.controller;

import com.syntaxtype.demo.features.lesson.dto.ScoreDTO;
import com.syntaxtype.demo.features.statistics.dto.LeaderboardUpdateResult;
import com.syntaxtype.demo.features.statistics.dto.ScoreSubmissionRequest;
import com.syntaxtype.demo.core.enums.Category;
import com.syntaxtype.demo.core.security.CustomUserDetails;
import com.syntaxtype.demo.features.lesson.service.ScoreService;
import com.syntaxtype.demo.features.statistics.service.LeaderboardService;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.syntaxtype.demo.features.lesson.entity.Score;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/scores")
public class ScoreController {

    private final ScoreService scoreService;
    private final LeaderboardService leaderboardService;

    public ScoreController(ScoreService scoreService, LeaderboardService leaderboardService) {
        this.scoreService = scoreService;
        this.leaderboardService = leaderboardService;
    }
    @PostMapping
    public ResponseEntity<Score> submitScore(@RequestBody ScoreDTO scoreDTO) {
        Score score = new Score();
        score.setScore(scoreDTO.getScore());
        score.setTimeInSeconds(scoreDTO.getTimeInSeconds());
        score.setChallengeType(scoreDTO.getChallengeType());
        score.setWpm(scoreDTO.getWpm());
        score.setSubmittedAt(LocalDateTime.now());

        return ResponseEntity.ok(scoreService.saveScore(score));
    }


    @PostMapping("/falling")
    public ResponseEntity<Score> submitFallingScore(@RequestBody ScoreDTO req) {
        Score score = new Score();
        score.setScore(req.getScore());
        score.setTimeInSeconds(req.getTimeInSeconds());
        score.setChallengeType("falling");
        score.setWpm(req.getWpm());
        score.setSubmittedAt(LocalDateTime.now());

        return ResponseEntity.ok(scoreService.saveScore(score));
    }
    @GetMapping
    public List<Score> getAllScores() {
        return scoreService.getAllScores();
    }

    // Get all falling scores
    @GetMapping("/falling")
    public List<Score> getFallingScores() {
        return scoreService.getScoresByTypeDesc("falling");
    }

    /**
     * Submit a game score with category.
     * Saves to Score table always, updates Leaderboard only if new score is better.
     *
     * @param category The game category (TYPING_TESTS, FALLING_WORDS, GALAXY, GRID, etc.)
     * @param request The score submission data
     * @param userDetails The authenticated user from JWT
     * @return LeaderboardUpdateResult with success, isNewBest, and rank
     */
    @PostMapping("/{category}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @CacheEvict(value = "leaderboard", allEntries = true)
    public ResponseEntity<LeaderboardUpdateResult> submitScore(
            @PathVariable String category,
            @RequestBody ScoreSubmissionRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        // Parse category from path
        Category categoryEnum;
        try {
            categoryEnum = Category.valueOf(category.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }

        // Get username from JWT
        String username = userDetails.getUser().getUsername();

        // Save to Score table (always)
        Score score = new Score();
        score.setScore(Optional.ofNullable(request.getScore()).orElse(0));
        score.setTimeInSeconds(Optional.ofNullable(request.getTimeSpent()).orElse(0));
        score.setChallengeType(categoryEnum.name());
        score.setWpm(Optional.ofNullable(request.getWpm()).orElse(0));
        score.setSubmittedAt(LocalDateTime.now());
        score.setUser(userDetails.getUser());
        scoreService.saveScore(score);

        // Update leaderboard if better
        LeaderboardUpdateResult result = leaderboardService.updateLeaderboardIfBetter(
                username,
                categoryEnum,
                Optional.ofNullable(request.getWpm()).orElse(0),
                Optional.ofNullable(request.getAccuracy()).orElse(100),
                Optional.ofNullable(request.getScore()).orElse(0)
        );

        return ResponseEntity.ok(result);
    }


}