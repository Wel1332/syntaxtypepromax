package com.syntaxtype.demo.features.lesson.dto;

import com.syntaxtype.demo.core.enums.ChallengeType;
import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChallengeDTO {
    private Long challengeId;
    private Long lessonId;
    private ChallengeType type;
    private String paragraph;
    private List<String> words;
    private Integer testTimer;
    private Integer speed;      // Added field
    private Integer maxLives;
    private Boolean useLives;
    private List<String> wrongWords;// Added field
}