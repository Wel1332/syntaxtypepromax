package com.syntaxtype.demo.features.classroom.dto;

import lombok.Data;

@Data
public class ChallengeAttemptRequest {
    private Integer score;
    private Integer correctCount;
    private Integer totalCount;
    private Integer accuracy;
    private Integer durationSeconds;
}
