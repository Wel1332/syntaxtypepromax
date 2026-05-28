package com.syntaxtype.demo.features.statistics.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserStatisticsDTO {
    private Long userId;
    private Integer wordsPerMinute;
    private Integer accuracy;
    private Integer totalWordsTyped;
    private Integer totalTimeSpent;
    private Integer totalErrors;
    private Integer totalTestsTaken;
    private Integer fastestClearTime;
}