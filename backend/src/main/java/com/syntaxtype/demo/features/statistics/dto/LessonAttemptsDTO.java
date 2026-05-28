package com.syntaxtype.demo.features.statistics.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonAttemptsDTO {
    private Long lessonAttemptsId;
    private Long studentId;
    private Long lessonId;
    private Integer wpm;
    private Integer accuracy;
    private Integer completionTime;
    private LocalDateTime attemptedAt;
}
