package com.syntaxtype.demo.features.junction.entity.compositekeys;

import jakarta.persistence.Embeddable;

import lombok.*;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherTopicsId {
    private Long teacher;
    private Long topic;
}
