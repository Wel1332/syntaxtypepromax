package com.syntaxtype.demo.features.user.dto.requests;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentUpdateRequest {
    private String firstname;
    private String lastname;
    private String universityEmail;
    private String course;
    private String yearLevel;
    private String className;
    private String section;
}
