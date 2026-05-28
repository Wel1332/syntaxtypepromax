package com.syntaxtype.demo.features.junction.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherTopicsDTO {
    private Long teacherId;
    private Long topicId;
}
