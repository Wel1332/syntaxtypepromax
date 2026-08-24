package com.syntaxtype.demo.features.lesson.dto;

import lombok.*;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonsDTO {
    private Long lessonId;
    private String title;
    private String content;
}
