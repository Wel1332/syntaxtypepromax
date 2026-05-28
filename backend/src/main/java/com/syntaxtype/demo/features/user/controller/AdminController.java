package com.syntaxtype.demo.features.user.controller;

import com.syntaxtype.demo.features.user.dto.AdminDTO;
import com.syntaxtype.demo.features.user.entity.User;
import com.syntaxtype.demo.features.user.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/admins")
@RequiredArgsConstructor
public class AdminController {
    private final AdminService adminService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<AdminDTO>> getAllAdmins() {
        return ResponseEntity.ok(adminService.findAll());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/user/{userId}")
    public ResponseEntity<Optional<AdminDTO>> getAdminByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(adminService.findByUserId(userId));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/by-user")
    public ResponseEntity<Optional<AdminDTO>> getAdminByUser(@RequestBody User user) {
        return ResponseEntity.ok(adminService.findByUser(user));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/first-name/{firstName}")
    public ResponseEntity<List<AdminDTO>> getAdminsByFirstName(@PathVariable String firstName) {
        return ResponseEntity.ok(adminService.findByFirstName(firstName));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/last-name/{lastName}")
    public ResponseEntity<List<AdminDTO>> getAdminsByLastName(@PathVariable String lastName) {
        return ResponseEntity.ok(adminService.findByLastName(lastName));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<AdminDTO> createAdmin(@RequestBody AdminDTO adminDTO, @RequestParam Long userId) {
        User user = new User();
        user.setUserId(userId);
        return ResponseEntity.ok(adminService.save(adminDTO, user));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{adminId}/first-name")
    public ResponseEntity<AdminDTO> updateFirstName(@PathVariable Long adminId, @RequestParam String newFirstName) {
        AdminDTO updated = adminService.updateFirstName(adminId, newFirstName);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{adminId}/last-name")
    public ResponseEntity<AdminDTO> updateLastName(@PathVariable Long adminId, @RequestParam String newLastName) {
        AdminDTO updated = adminService.updateLastName(adminId, newLastName);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{adminId}")
    public ResponseEntity<Void> deleteAdmin(@PathVariable Long adminId) {
        adminService.deleteById(adminId);
        return ResponseEntity.noContent().build();
    }
}
