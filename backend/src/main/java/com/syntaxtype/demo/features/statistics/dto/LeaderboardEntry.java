package com.syntaxtype.demo.features.statistics.dto;

import com.syntaxtype.demo.features.statistics.entity.Leaderboard;
import lombok.*;

import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardEntry {
    private Integer rank;
    private String username;
    private Double score;
    private Integer wpm;
    private Integer accuracy;
    private String gameName;
    private LocalDateTime dateAchieved;

    /**
     * Creates a LeaderboardEntry from a Leaderboard entity.
     * Calculates combined score based on WPM and accuracy.
     *
     * Combined score formula:
     * - Base: wpm * (accuracy / 100.0)
     * - If accuracy > 95: base * 1.5
     * - Rounded to 2 decimal places
     *
     * @param lb The Leaderboard entity
     * @param rank The rank position
     * @param dateAchieved The date the score was achieved
     * @return A new LeaderboardEntry instance
     */
    public static LeaderboardEntry fromLeaderboard(Leaderboard lb, Integer rank, LocalDateTime dateAchieved) {
        Double combinedScore = calculateCombinedScore(lb.getWordsPerMinute(), lb.getAccuracy());
        
        return LeaderboardEntry.builder()
                .rank(rank)
                .username(lb.getUser().getUsername())
                .score(combinedScore)
                .wpm(lb.getWordsPerMinute())
                .accuracy(lb.getAccuracy())
                .gameName(lb.getCategory().name())
                .dateAchieved(dateAchieved)
                .build();
    }

    /**
     * Calculates combined score from WPM and accuracy.
     *
     * Combined score formula:
     * - Base: wpm * (accuracy / 100.0)
     * - If accuracy > 95: base * 1.5
     * - Rounded to 2 decimal places
     *
     * @param wpm Words per minute
     * @param accuracy Accuracy percentage (0-100)
     * @return The calculated combined score rounded to 2 decimal places
     */
    public static Double calculateCombinedScore(Integer wpm, Integer accuracy) {
        if (wpm == null || accuracy == null) {
            return 0.0;
        }
        
        double base = wpm * (accuracy / 100.0);
        if (accuracy > 95) {
            base = base * 1.5;
        }
        
        return BigDecimal.valueOf(base)
                .setScale(2, RoundingMode.HALF_UP)
                .doubleValue();
    }
}
