package com.syntaxtype.demo.features.user.service;

import com.syntaxtype.demo.features.user.dto.UserDTO;
import com.syntaxtype.demo.features.user.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Regression cover for the registration-overwrite defect.
 *
 * convertFromDTO used to copy a client-supplied userId onto the new entity. A non-null ID
 * makes Spring Data treat the entity as detached, so save() issues a merge — an UPDATE of
 * the row with that ID — instead of an INSERT. Because POST /api/auth/register is public and
 * AuthController's duplicate guards only reject colliding usernames and emails, an
 * unauthenticated caller could overwrite any account, admin included, by posting that
 * account's ID alongside fresh credentials.
 *
 * The service is constructed with null collaborators on purpose: convertFromDTO touches none
 * of them, and a real context would obscure what is being asserted.
 */
class UserServiceRegistrationTest {

    private final UserService userService = new UserService(null, null, null, null, null);

    @Test
    @DisplayName("convertFromDTO ignores a client-supplied userId so registration cannot merge")
    void ignoresClientSuppliedUserId() {
        UserDTO hostile = UserDTO.builder()
                .userId(1L)                       // the victim's id
                .username("not-taken")            // sails past existsByUsername
                .email("not-taken@example.com")   // sails past existsByEmail
                .password("irrelevant")
                .build();

        User user = userService.convertFromDTO(hostile);

        assertThat(user.getUserId())
                .as("a null id forces an INSERT; any value here reopens account takeover")
                .isNull();
    }

    @Test
    @DisplayName("convertFromDTO still carries the fields registration legitimately supplies")
    void mapsTheLegitimateFields() {
        UserDTO dto = UserDTO.builder()
                .username("student01")
                .email("student01@example.com")
                .password("raw-password")
                .build();

        User user = userService.convertFromDTO(dto);

        assertThat(user.getUsername()).isEqualTo("student01");
        assertThat(user.getEmail()).isEqualTo("student01@example.com");
        assertThat(user.getPassword()).isEqualTo("raw-password");
    }
}
