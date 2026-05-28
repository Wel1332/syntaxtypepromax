package com.syntaxtype.demo.features.user.dto;

import com.syntaxtype.demo.core.enums.Role;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long userId;
    private String username;
    private String email;
    private String password;
    private Role userRole;
    private boolean isTempPassword;
    private LocalDateTime createdAt;
}
