package com.syntaxtype.demo.features.user.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDTO {
    private Long adminId;
    private Long userId;
    private String firstName;
    private String lastName;
}
