package com.syntaxtype.demo.features.statistics.dto;

import lombok.*;

/**
 * Request DTO for submitting game scores.
 * Used by POST /api/scores/{category} endpoint.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoreSubmissionRequest {
    /**
     * Words per minute for typing games.
     * Set to 0 for non-typing games.
     */
    private Integer wpm;

    /**
     * Accuracy percentage for typing games.
     * Set to 100 for non-typing games.
     */
    private Integer accuracy;

    /**
     * Raw game score.
     */
    private Integer score;

    /**
     * Time spent in seconds (optional).
     */
    private Integer timeSpent;

    /**
     * Assessment mode: PRE_TEST, PRACTICE, or POST_TEST.
     * Null for casual (non-assessment) plays. Required to compute
     * pre-test → post-test improvement for the research objectives.
     */
    private String modeType;

    /**
     * Per-objective tallies (optional, default 0):
     *   correctCount — items answered/cleared correctly this session
     *     (Translation Terminal prompts correct, Syntax Sniper blanks filled,
     *      Bug Smasher bugs fixed).
     *   totalCount   — items attempted this session.
     *   errorCount   — mistakes this session (misses / wrong fixes).
     * These drive error-detection, syntax-recall, and punctuation-accuracy
     * reporting independent of the raw game score.
     */
    private Integer correctCount;
    private Integer totalCount;
    private Integer errorCount;

    /**
     * Per-drill detail for this session, in the order presented (Objective 2.3).
     *
     * Optional. Omitting it stores the session aggregate exactly as before, which
     * is what the game modes that do not yet track per-drill data still do. When
     * present, each entry becomes one drill_attempts row so accuracy, completion
     * time and error distribution stay recoverable per drill instead of only per
     * session.
     */
    private java.util.List<DrillAttemptRequest> drills;
}