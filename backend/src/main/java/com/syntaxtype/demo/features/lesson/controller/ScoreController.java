package com.syntaxtype.demo.features.lesson.controller;

import com.syntaxtype.demo.features.lesson.dto.ScoreDTO;
import com.syntaxtype.demo.features.statistics.dto.LeaderboardUpdateResult;
import com.syntaxtype.demo.features.statistics.dto.ScoreSubmissionRequest;
import com.syntaxtype.demo.core.enums.Category;
import com.syntaxtype.demo.core.security.CustomUserDetails;
import com.syntaxtype.demo.features.lesson.repository.ScoreRepository;
import com.syntaxtype.demo.features.lesson.service.ScoreService;
import com.syntaxtype.demo.features.statistics.service.AchievementEvaluatorService;
import com.syntaxtype.demo.features.statistics.service.LeaderboardService;
import com.syntaxtype.demo.features.statistics.service.UserStatisticsService;
import com.syntaxtype.demo.features.user.entity.User;
import com.syntaxtype.demo.features.user.repository.UserRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import com.syntaxtype.demo.features.lesson.entity.Score;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/scores")
public class ScoreController {

    private final ScoreService scoreService;
    private final ScoreRepository scoreRepository;
    private final LeaderboardService leaderboardService;
    private final UserStatisticsService userStatisticsService;
    private final AchievementEvaluatorService achievementEvaluatorService;
    private final UserRepository userRepository;

    public ScoreController(ScoreService scoreService,
                           ScoreRepository scoreRepository,
                           LeaderboardService leaderboardService,
                           UserStatisticsService userStatisticsService,
                           AchievementEvaluatorService achievementEvaluatorService,
                           UserRepository userRepository) {
        this.scoreService = scoreService;
        this.scoreRepository = scoreRepository;
        this.leaderboardService = leaderboardService;
        this.userStatisticsService = userStatisticsService;
        this.achievementEvaluatorService = achievementEvaluatorService;
        this.userRepository = userRepository;
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

    /** Returns only the authenticated user's scores, newest first. */
    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    public ResponseEntity<List<Score>> getMyScores(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(scoreRepository.findByUserOrderBySubmittedAtDesc(userDetails.getUser()));
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
    @Transactional
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

        // The principal's User comes from the JWT filter's (closed) persistence
        // context, so it's detached. Re-load a managed instance inside this
        // request's transaction; UserStatistics uses @MapsId and would otherwise
        // throw "detached entity passed to persist" on a user's first session.
        User user = userRepository.findById(userDetails.getUser().getUserId())
                .orElse(userDetails.getUser());
        String username = user.getUsername();

        int wpm        = Optional.ofNullable(request.getWpm()).orElse(0);
        int accuracy   = Optional.ofNullable(request.getAccuracy()).orElse(100);
        int rawScore   = Optional.ofNullable(request.getScore()).orElse(0);
        int correct    = Optional.ofNullable(request.getCorrectCount()).orElse(0);
        int total      = Optional.ofNullable(request.getTotalCount()).orElse(0);
        int errors     = Optional.ofNullable(request.getErrorCount()).orElse(0);

        // Save to Score table (always)
        Score score = new Score();
        score.setScore(rawScore);
        score.setTimeInSeconds(Optional.ofNullable(request.getTimeSpent()).orElse(0));
        score.setChallengeType(categoryEnum.name());
        score.setWpm(wpm);
        score.setAccuracy(accuracy);
        score.setModeType(request.getModeType()); // PRE_TEST / PRACTICE / POST_TEST / null
        score.setCorrectCount(correct);
        score.setTotalCount(total);
        score.setErrorCount(errors);
        score.setSubmittedAt(LocalDateTime.now());
        score.setUser(user);
        scoreService.saveScore(score);

        // Update leaderboard if better — but never for PRACTICE plays. Practice
        // is unlimited training and is documented as keeping no leaderboard
        // record, so letting it set a best would let students grind the board
        // and undercut the Pre-Test/Post-Test assessment. XP, cumulative stats,
        // and badges below are still awarded for practice.
        boolean isPractice = "PRACTICE".equalsIgnoreCase(request.getModeType());
        LeaderboardUpdateResult result = isPractice
                ? LeaderboardUpdateResult.builder().success(true).isNewBest(false).rank(null).build()
                : leaderboardService.updateLeaderboardIfBetter(
                        username, categoryEnum, wpm, accuracy, rawScore);

        // Update all cumulative stats (WPM, accuracy, tests taken, time, XP, errors) in one write
        userStatisticsService.recordSession(
                user, wpm, accuracy,
                Optional.ofNullable(request.getTimeSpent()).orElse(0), rawScore, errors);

        // Auto-award any newly triggered achievement badges
        List<String> badges = achievementEvaluatorService.evaluateAndAward(
                user, wpm, accuracy, rawScore);
        result.setAwardedBadges(badges);

        return ResponseEntity.ok(result);
    }


}