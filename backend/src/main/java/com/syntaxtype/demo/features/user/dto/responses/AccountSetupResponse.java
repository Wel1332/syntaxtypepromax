package com.syntaxtype.demo.features.user.dto.responses;

import com.syntaxtype.demo.features.user.dto.UserDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AccountSetupResponse {
    private String token;
    private UserDTO user;
}