package com.syntaxtype.demo.features.statistics.controller;

import com.syntaxtype.demo.features.statistics.dto.StudentAchievementsDTO;
import com.syntaxtype.demo.features.user.entity.Student;
import com.syntaxtype.demo.features.statistics.entity.Achievements;
import com.syntaxtype.demo.features.statistics.service.StudentAchievementsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/student-achievements")
@RequiredArgsConstructor
public class StudentAchievementsController {
    private final StudentAchievementsService studentAchievementsService;

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @GetMapping
    public ResponseEntity<List<StudentAchievementsDTO>> getAllStudentAchievements() {
        return ResponseEntity.ok(studentAchievementsService.findAll());
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @GetMapping("/{studentAchievementId}")
    public ResponseEntity<Optional<StudentAchievementsDTO>> getById(@PathVariable Long studentAchievementId) {
        return ResponseEntity.ok(studentAchievementsService.findByStudentAchievementId(studentAchievementId));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @GetMapping("/student")
    public ResponseEntity<List<StudentAchievementsDTO>> getByStudent(@RequestBody Student student) {
        return ResponseEntity.ok(studentAchievementsService.findByStudent(student));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @GetMapping("/achievement/{achievementId}")
    public ResponseEntity<List<StudentAchievementsDTO>> getByAchievementId(@PathVariable Long achievementId) {
        Achievements achievement = new Achievements();
        achievement.setAchievementId(achievementId);
        return ResponseEntity.ok(studentAchievementsService.findByAchievementId(achievement));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @GetMapping("/awarded-at/{awardedAt}")
    public ResponseEntity<List<StudentAchievementsDTO>> getByAwardedAt(@PathVariable String awardedAt) {
        LocalDateTime dateTime = LocalDateTime.parse(awardedAt);
        return ResponseEntity.ok(studentAchievementsService.findByAwardedAt(dateTime));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @PostMapping
    public ResponseEntity<StudentAchievementsDTO> createStudentAchievement(@RequestBody StudentAchievementsDTO dto, @RequestParam Long studentId, @RequestParam Long achievementId) {
        Student student = new Student();
        student.setStudentId(studentId);
        Achievements achievement = new Achievements();
        achievement.setAchievementId(achievementId);
        return ResponseEntity.ok(studentAchievementsService.save(dto, student, achievement));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @PatchMapping("/{studentAchievementId}/student")
    public ResponseEntity<StudentAchievementsDTO> updateStudent(@PathVariable Long studentAchievementId, @RequestParam Long newStudentId) {
        Student newStudent = new Student();
        newStudent.setStudentId(newStudentId);
        StudentAchievementsDTO updated = studentAchievementsService.updateStudent(studentAchievementId, newStudent);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @PatchMapping("/{studentAchievementId}/achievement")
    public ResponseEntity<StudentAchievementsDTO> updateAchievement(@PathVariable Long studentAchievementId, @RequestParam Long newAchievementId) {
        Achievements newAchievement = new Achievements();
        newAchievement.setAchievementId(newAchievementId);
        StudentAchievementsDTO updated = studentAchievementsService.updateAchievement(studentAchievementId, newAchievement);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @PatchMapping("/{studentAchievementId}/awarded-at")
    public ResponseEntity<StudentAchievementsDTO> updateAwardedAt(@PathVariable Long studentAchievementId, @RequestParam String newAwardedAt) {
        java.time.LocalDateTime awardedAt = java.time.LocalDateTime.parse(newAwardedAt);
        StudentAchievementsDTO updated = studentAchievementsService.updateAwardedAt(studentAchievementId, awardedAt);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable Long id) {
        studentAchievementsService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
