package com.syntaxtype.demo.features.statistics.dto;

import com.syntaxtype.demo.core.enums.Category;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardDTO {
    private Long leaderboardId;
    private Long userId;
    private Integer wordsPerMinute;
    private Integer accuracy;
    private Integer totalWordsTyped;
    private Integer totalTimeSpent;
    private Category category;
}
