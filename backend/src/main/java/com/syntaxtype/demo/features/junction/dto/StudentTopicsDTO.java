package com.syntaxtype.demo.features.junction.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentTopicsDTO {
    private Long studentId;
    private Long topicId;
}
