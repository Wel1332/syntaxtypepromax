package com.syntaxtype.demo.features.user.controller;

import com.syntaxtype.demo.features.user.dto.UserDTO;
import com.syntaxtype.demo.features.user.dto.requests.TempTeacherUpdate;
import com.syntaxtype.demo.features.user.dto.responses.AccountSetupResponse;
import com.syntaxtype.demo.core.enums.Role;
import com.syntaxtype.demo.features.user.entity.User;
import com.syntaxtype.demo.features.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @PreAuthorize("hasAnyRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.findAll());
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @GetMapping("/id/{userId}")
    public ResponseEntity<Optional<UserDTO>> getUserByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(userService.findByUserId(userId));
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @GetMapping("/username/{username}")
    public ResponseEntity<Optional<UserDTO>> getUserByUsername(@PathVariable String username) {
        return ResponseEntity.ok(userService.findByUsername(username));
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @GetMapping("/email/{email}")
    public ResponseEntity<User> getUserByEmail(@PathVariable String email) {
        return ResponseEntity.ok(userService.findByEmail(email));
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @GetMapping("/role/{role}")
    public ResponseEntity<List<UserDTO>> getUsersByRole(@PathVariable Role role) {
        return ResponseEntity.ok(userService.findByUserRole(role));
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @GetMapping("/temp-password/{isTempPassword}")
    public ResponseEntity<List<UserDTO>> getUsersByIsTempPassword(@PathVariable boolean isTempPassword) {
        return ResponseEntity.ok(userService.findByIsTempPassword(isTempPassword));
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @GetMapping("/created-at/{createdAt}")
    public ResponseEntity<List<UserDTO>> getUsersByCreatedAt(@PathVariable String createdAt) {
        LocalDateTime dateTime = LocalDateTime.parse(createdAt);
        return ResponseEntity.ok(userService.findByCreatedAt(dateTime));
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @PostMapping
    public ResponseEntity<UserDTO> createUser(@RequestBody UserDTO userDTO) {
        return ResponseEntity.ok(userService.save(userDTO));
    }

    // PATCH: Update email
    @PreAuthorize("hasAnyRole('ADMIN')")
    @PatchMapping("/{userId}/email")
    public ResponseEntity<UserDTO> updateEmail(@PathVariable Long userId, @RequestParam String newEmail) {
        UserDTO updated = userService.updateEmail(userId, newEmail);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    // PATCH: Update password
    @PreAuthorize("hasAnyRole('ADMIN')")
    @PatchMapping("/{userId}/password")
    public ResponseEntity<UserDTO> updatePassword(@PathVariable Long userId, @RequestParam String newPassword) {
        UserDTO updated = userService.updatePassword(userId, newPassword);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('TEACHER')")
    @PutMapping("/update-temp-teacher/{userId}")
    public ResponseEntity<AccountSetupResponse> updateTempTeacher(@PathVariable Long userId, @RequestBody TempTeacherUpdate updateRequest) {
        AccountSetupResponse response = userService.updateTempTeacher(userId, updateRequest);
        return ResponseEntity.ok(response);
    }
}
