package com.syntaxtype.demo.features.statistics.controller;

import com.syntaxtype.demo.core.security.AccessGuard;
import com.syntaxtype.demo.core.security.CustomUserDetails;
import com.syntaxtype.demo.features.statistics.dto.StudentAchievementsDTO;
import com.syntaxtype.demo.features.user.entity.Student;
import com.syntaxtype.demo.features.statistics.entity.Achievements;
import com.syntaxtype.demo.features.statistics.service.StudentAchievementsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Badges are awarded by the server: ScoreController calls
 * AchievementEvaluatorService.evaluateAndAward on every submission. No student flow needs to
 * create, re-point or delete an award, so the write endpoints are staff-only.
 *
 * They were previously open to STUDENT, which meant a participant could grant themselves any
 * badge by POSTing their own studentId, or re-point an existing award with the /student
 * patch. For a platform whose data backs a study, that is score tampering, not cosmetics.
 */
@RestController
@RequestMapping("/api/student-achievements")
@RequiredArgsConstructor
public class StudentAchievementsController {
    private final StudentAchievementsService studentAchievementsService;

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping
    public ResponseEntity<List<StudentAchievementsDTO>> getAllStudentAchievements() {
        return ResponseEntity.ok(studentAchievementsService.findAll());
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping("/{studentAchievementId}")
    public ResponseEntity<Optional<StudentAchievementsDTO>> getById(@PathVariable Long studentAchievementId) {
        return ResponseEntity.ok(studentAchievementsService.findByStudentAchievementId(studentAchievementId));
    }

    /** The one endpoint a student screen uses — their own badge wall. */
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @GetMapping("/by-student")
    public ResponseEntity<List<StudentAchievementsDTO>> getByStudentId(
            @RequestParam Long studentId,
            @AuthenticationPrincipal CustomUserDetails caller) {
        AccessGuard.requireSelfOrStaff(studentId, caller, "badges");
        Student student = new Student();
        student.setStudentId(studentId);
        return ResponseEntity.ok(studentAchievementsService.findByStudent(student));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping("/achievement/{achievementId}")
    public ResponseEntity<List<StudentAchievementsDTO>> getByAchievementId(@PathVariable Long achievementId) {
        Achievements achievement = new Achievements();
        achievement.setAchievementId(achievementId);
        return ResponseEntity.ok(studentAchievementsService.findByAchievementId(achievement));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping("/awarded-at/{awardedAt}")
    public ResponseEntity<List<StudentAchievementsDTO>> getByAwardedAt(@PathVariable String awardedAt) {
        LocalDateTime dateTime = LocalDateTime.parse(awardedAt);
        return ResponseEntity.ok(studentAchievementsService.findByAwardedAt(dateTime));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @PostMapping
    public ResponseEntity<StudentAchievementsDTO> createStudentAchievement(@RequestBody StudentAchievementsDTO dto, @RequestParam Long studentId, @RequestParam Long achievementId) {
        Student student = new Student();
        student.setStudentId(studentId);
        Achievements achievement = new Achievements();
        achievement.setAchievementId(achievementId);
        return ResponseEntity.ok(studentAchievementsService.save(dto, student, achievement));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
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

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
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

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @PatchMapping("/{studentAchievementId}/awarded-at")
    public ResponseEntity<StudentAchievementsDTO> updateAwardedAt(@PathVariable Long studentAchievementId, @RequestParam String newAwardedAt) {
        java.time.LocalDateTime awardedAt = java.time.LocalDateTime.parse(newAwardedAt);
        StudentAchievementsDTO updated = studentAchievementsService.updateAwardedAt(studentAchievementId, awardedAt);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable Long id) {
        studentAchievementsService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
