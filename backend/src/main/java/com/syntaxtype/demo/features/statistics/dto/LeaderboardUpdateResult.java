package com.syntaxtype.demo.features.statistics.dto;

import lombok.*;

/**
 * Result of a leaderboard update operation.
 * Returned by POST /api/scores/{category} endpoint.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardUpdateResult {
    /**
     * Whether the operation completed successfully.
     */
    private Boolean success;

    /**
     * Whether this is a new best score for the user in this category.
     */
    private Boolean isNewBest;

    /**
     * Current rank of the user in this category (null if not on leaderboard).
     */
    private Integer rank;
}