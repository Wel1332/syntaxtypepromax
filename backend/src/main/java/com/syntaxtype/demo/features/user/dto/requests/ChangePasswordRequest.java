package com.syntaxtype.demo.features.user.dto.requests;

import lombok.Getter;
import lombok.Setter;

// Getters and setters only, not @Data: a generated toString would print both
// passwords into any log line that ever includes this object.
@Getter
@Setter
public class ChangePasswordRequest {
    private String currentPassword;
    private String newPassword;
}
