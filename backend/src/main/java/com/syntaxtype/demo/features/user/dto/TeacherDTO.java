package com.syntaxtype.demo.features.user.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherDTO {
    private Long teacherId;
    private UserDTO user; // Changed from Long userId to UserDTO
    private String firstName;
    private String lastName;
    private String institution;
    private String subject;
}
