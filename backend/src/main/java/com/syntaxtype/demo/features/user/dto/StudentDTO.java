package com.syntaxtype.demo.features.user.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentDTO {
    private Long studentId;
    private UserDTO user; // Changed from Long userId to UserDTO
    private String firstName;
    private String lastName;
    private String universityEmail;
    private String course;
    private String yearLevel;
    private String className;
    private String section;
}
