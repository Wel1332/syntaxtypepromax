package com.syntaxtype.demo.features.user.controller;

import com.syntaxtype.demo.features.user.dto.StudentDTO;
import com.syntaxtype.demo.features.user.entity.User;
import com.syntaxtype.demo.features.user.service.StudentService;
import com.syntaxtype.demo.features.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {
    private final StudentService studentService;
    private final UserService userService;

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @GetMapping
    public ResponseEntity<List<StudentDTO>> getAllStudents() {
        return ResponseEntity.ok(studentService.findAll());
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @GetMapping("/user/{userId}")
    public ResponseEntity<Optional<StudentDTO>> getStudentByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(studentService.findByUserId(userId));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @GetMapping("/by-user")
    public ResponseEntity<Optional<StudentDTO>> getStudentByUser(@RequestBody User user) {
        return ResponseEntity.ok(studentService.findByUser(user));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @GetMapping("/first-name/{firstName}")
    public ResponseEntity<List<StudentDTO>> getStudentsByFirstName(@PathVariable String firstName) {
        return ResponseEntity.ok(studentService.findByFirstName(firstName));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @GetMapping("/last-name/{lastName}")
    public ResponseEntity<List<StudentDTO>> getStudentsByLastName(@PathVariable String lastName) {
        return ResponseEntity.ok(studentService.findByLastName(lastName));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @GetMapping("/university-email/{universityEmail}")
    public ResponseEntity<List<StudentDTO>> getStudentsByUniversityEmail(@PathVariable String universityEmail) {
        return ResponseEntity.ok(studentService.findByUniversityEmail(universityEmail));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @GetMapping("/course/{course}")
    public ResponseEntity<List<StudentDTO>> getStudentsByCourse(@PathVariable String course) {
        return ResponseEntity.ok(studentService.findByCourse(course));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @GetMapping("/year-level/{yearLevel}")
    public ResponseEntity<List<StudentDTO>> getStudentsByYearLevel(@PathVariable String yearLevel) {
        return ResponseEntity.ok(studentService.findByYearLevel(yearLevel));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @GetMapping("/class-name/{className}")
    public ResponseEntity<List<StudentDTO>> getStudentsByClassName(@PathVariable String className) {
        return ResponseEntity.ok(studentService.findByClassName(className));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @GetMapping("/section/{section}")
    public ResponseEntity<List<StudentDTO>> getStudentsBySection(@PathVariable String section) {
        return ResponseEntity.ok(studentService.findBySection(section));
    }

    @PreAuthorize("hasAnyRole('ADMIN','STUDENT')")
    @PostMapping
    public ResponseEntity<StudentDTO> createStudent(@RequestBody StudentDTO studentDTO, @RequestParam Long userId) {
        Optional<User> userOptional = userService.findUserEntityById(userId);
        if (userOptional.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        User user = userOptional.get();
        return ResponseEntity.ok(studentService.save(studentDTO, user));
    }

    @PreAuthorize("hasAnyRole('ADMIN','STUDENT')")
    @PatchMapping("/{studentId}/first-name")
    public ResponseEntity<StudentDTO> updateFirstName(@PathVariable Long studentId, @RequestParam String newFirstName) {
        StudentDTO updated = studentService.updateFirstName(studentId, newFirstName);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','STUDENT')")
    @PatchMapping("/{studentId}/last-name")
    public ResponseEntity<StudentDTO> updateLastName(@PathVariable Long studentId, @RequestParam String newLastName) {
        StudentDTO updated = studentService.updateLastName(studentId, newLastName);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','STUDENT')")
    @PatchMapping("/{studentId}/university-email")
    public ResponseEntity<StudentDTO> updateUniversityEmail(@PathVariable Long studentId, @RequestParam String newUniversityEmail) {
        StudentDTO updated = studentService.updateUniversityEmail(studentId, newUniversityEmail);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','STUDENT')")
    @PatchMapping("/{studentId}/course")
    public ResponseEntity<StudentDTO> updateCourse(@PathVariable Long studentId, @RequestParam String newCourse) {
        StudentDTO updated = studentService.updateCourse(studentId, newCourse);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','STUDENT')")
    @PatchMapping("/{studentId}/year-level")
    public ResponseEntity<StudentDTO> updateYearLevel(@PathVariable Long studentId, @RequestParam String newYearLevel) {
        StudentDTO updated = studentService.updateYearLevel(studentId, newYearLevel);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','STUDENT')")
    @PatchMapping("/{studentId}/class-name")
    public ResponseEntity<StudentDTO> updateClassName(@PathVariable Long studentId, @RequestParam String newClassName) {
        StudentDTO updated = studentService.updateClassName(studentId, newClassName);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','STUDENT')")
    @PatchMapping("/{studentId}/section")
    public ResponseEntity<StudentDTO> updateSection(@PathVariable Long studentId, @RequestParam String newSection) {
        StudentDTO updated = studentService.updateSection(studentId, newSection);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','STUDENT')")
    @DeleteMapping("/{studentId}")
    public ResponseEntity<Void> deleteStudent(@PathVariable Long studentId) {
        studentService.deleteById(studentId);
        return ResponseEntity.noContent().build();
    }

    // NEW: Add a delete endpoint that takes userId
    @PreAuthorize("hasAnyRole('ADMIN')")
    @DeleteMapping("/by-user-id/{userId}")
    public ResponseEntity<Void> deleteStudentByUserId(@PathVariable Long userId) {
        studentService.deleteByUserId(userId); // You will need to add this method to StudentService
        return ResponseEntity.noContent().build();
    }
}
