package com.syntaxtype.demo.features.lesson.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonsDTO {
    private Long lessonId;
    private String title;
    private String content;
}
