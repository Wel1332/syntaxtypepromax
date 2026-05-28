package com.syntaxtype.demo.features.user.controller;

import com.syntaxtype.demo.core.enums.Role;
import com.syntaxtype.demo.features.user.dto.TeacherDTO;
import com.syntaxtype.demo.features.user.entity.User;
import com.syntaxtype.demo.features.user.service.TeacherService;
import com.syntaxtype.demo.features.user.service.UserService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/teachers")
@RequiredArgsConstructor
public class TeacherController {
    private final TeacherService teacherService;
    private final UserService userService; // Inject UserService

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping
    public ResponseEntity<List<TeacherDTO>> getAllTeachers() {
        return ResponseEntity.ok(teacherService.findAll());
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping("/user/{userId}")
    public ResponseEntity<Optional<TeacherDTO>> getTeacherByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(teacherService.findByUserId(userId));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping("/by-user")
    public ResponseEntity<Optional<TeacherDTO>> getTeacherByUser(@RequestBody User user) {
        return ResponseEntity.ok(teacherService.findByUser(user));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping("/first-name/{firstName}")
    public ResponseEntity<List<TeacherDTO>> getTeachersByFirstName(@PathVariable String firstName) {
        return ResponseEntity.ok(teacherService.findByFirstName(firstName));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping("/last-name/{lastName}")
    public ResponseEntity<List<TeacherDTO>> getTeachersByLastName(@PathVariable String lastName) {
        return ResponseEntity.ok(teacherService.findByLastName(lastName));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping("/institution/{institution}")
    public ResponseEntity<List<TeacherDTO>> getTeachersByInstitution(@PathVariable String institution) {
        return ResponseEntity.ok(teacherService.findByInstitution(institution));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping("/subject/{subject}")
    public ResponseEntity<List<TeacherDTO>> getTeachersBySubject(@PathVariable String subject) {
        return ResponseEntity.ok(teacherService.findBySubject(subject));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @PostMapping
    public ResponseEntity<TeacherDTO> createTeacher(@RequestBody TeacherDTO teacherDTO, @RequestParam Long userId) {
        // Fetch the User entity using UserService
        Optional<User> userOptional = userService.findUserEntityById(userId);

        if (userOptional.isEmpty()) {
            // If User not found, return 404
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }

        User user = userOptional.get();
        
        // Check if the user's role is TEACHER
        if (user.getUserRole() != Role.TEACHER) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null); // Or HttpStatus.FORBIDDEN
        }

        return ResponseEntity.ok(teacherService.save(teacherDTO, user));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @PatchMapping("/{teacherId}/first-name")
    public ResponseEntity<TeacherDTO> updateFirstName(@PathVariable Long teacherId, @RequestParam String newFirstName) {
        TeacherDTO updated = teacherService.updateFirstName(teacherId, newFirstName);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @PatchMapping("/{teacherId}/last-name")
    public ResponseEntity<TeacherDTO> updateLastName(@PathVariable Long teacherId, @RequestParam String newLastName) {
        TeacherDTO updated = teacherService.updateLastName(teacherId, newLastName);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @PatchMapping("/{teacherId}/institution")
    public ResponseEntity<TeacherDTO> updateInstitution(@PathVariable Long teacherId, @RequestParam String newInstitution) {
        TeacherDTO updated = teacherService.updateInstitution(teacherId, newInstitution);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @PatchMapping("/{teacherId}/subject")
    public ResponseEntity<TeacherDTO> updateSubject(@PathVariable Long teacherId, @RequestParam String newSubject) {
        TeacherDTO updated = teacherService.updateSubject(teacherId, newSubject);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @DeleteMapping("/{teacherId}")
    public ResponseEntity<Void> deleteTeacher(@PathVariable Long teacherId) {
        teacherService.deleteById(teacherId);
        return ResponseEntity.noContent().build();
    }
}
