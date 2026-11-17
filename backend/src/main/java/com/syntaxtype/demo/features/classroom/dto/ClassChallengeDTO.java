package com.syntaxtype.demo.features.classroom.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.syntaxtype.demo.core.enums.ContentGame;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * One challenge as a teacher or a student sees it. Fields that don't apply to the
 * caller stay null and are left out: lists carry no items, students get no
 * visibility flag, teachers get no attempt count.
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ClassChallengeDTO {
    private Long challengeId;
    private Long classroomId;
    private String classroomName;
    private ContentGame game;
    private String title;
    private String instructions;
    private Integer itemCount;
    private Integer maxAttempts;
    private Boolean visible;
    private Long attemptsUsed;
    private List<Map<String, Object>> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
