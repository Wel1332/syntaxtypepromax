package com.syntaxtype.demo.features.statistics.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AchievementsDTO {
    private Long achievementId;
    private String name;
    private String description;
    private Long createdById;
    private Long topicId;
    private LocalDateTime createdAt;
    private String triggerType;
    private Integer triggerValue;
}
