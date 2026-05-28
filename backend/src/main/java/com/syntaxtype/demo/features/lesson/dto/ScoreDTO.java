package com.syntaxtype.demo.features.lesson.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoreDTO {
    private Long id;
    private int score;
    private int timeInSeconds;
    private String challengeType;
    private double wpm;

}
