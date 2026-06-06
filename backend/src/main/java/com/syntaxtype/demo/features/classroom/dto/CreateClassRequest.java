package com.syntaxtype.demo.features.classroom.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateClassRequest {
    private String name;
    private String description;
}
