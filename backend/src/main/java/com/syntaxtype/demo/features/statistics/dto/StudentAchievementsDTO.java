package com.syntaxtype.demo.features.statistics.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentAchievementsDTO {
    private Long studentAchievementId;
    private Long studentId;
    private Long achievementId;
    private LocalDateTime awardedAt;
}
