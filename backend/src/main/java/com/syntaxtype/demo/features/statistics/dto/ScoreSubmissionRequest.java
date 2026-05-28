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
}