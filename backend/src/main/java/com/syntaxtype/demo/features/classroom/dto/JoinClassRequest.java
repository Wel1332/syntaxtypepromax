package com.syntaxtype.demo.features.classroom.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JoinClassRequest {
    private String classCode;
}
