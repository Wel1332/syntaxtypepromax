package com.syntaxtype.demo.features.statistics.dto;

import lombok.*;

/**
 * One drill inside a score submission (Objective 2.3).
 *
 * Every field is optional so a game can send only what its bank actually tags —
 * Syntax Sniper has ids and difficulty but no topic, Bug Smasher has an error
 * category. Missing values are stored as null rather than invented, because a
 * fabricated topic would silently distort the error distribution this data
 * exists to measure.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DrillAttemptRequest {

    /** Drill identifier from the bank, e.g. "P-01". */
    private String itemId;

    /** Syntax area or construct exercised. */
    private String topic;

    /** easy / medium / hard. */
    private String difficulty;

    /** Error category when the drill was missed and the game classifies errors. */
    private String errorCategory;

    /** Whether the drill was completed before its timer expired. */
    private Boolean cleared;

    /** Milliseconds spent on this drill. */
    private Integer timeMs;

    /** Wrong keystrokes or wrong answers on this drill. */
    private Integer misses;
}
