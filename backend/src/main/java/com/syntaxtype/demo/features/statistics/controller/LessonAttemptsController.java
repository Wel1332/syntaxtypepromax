package com.syntaxtype.demo.features.statistics.controller;

import com.syntaxtype.demo.features.statistics.dto.LessonAttemptsDTO;
import com.syntaxtype.demo.features.user.entity.Student;
import com.syntaxtype.demo.features.lesson.entity.Challenge;
import com.syntaxtype.demo.features.statistics.service.LessonAttemptsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/lesson-attempts")
@RequiredArgsConstructor
public class LessonAttemptsController {
    private final LessonAttemptsService lessonAttemptsService;

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @GetMapping
    public ResponseEntity<List<LessonAttemptsDTO>> getAllLessonAttempts() {
        return ResponseEntity.ok(lessonAttemptsService.findAll());
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @GetMapping("/{lessonAttemptsId}")
    public ResponseEntity<Optional<LessonAttemptsDTO>> getById(@PathVariable Long lessonAttemptsId) {
        return ResponseEntity.ok(lessonAttemptsService.findById(lessonAttemptsId));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @GetMapping("/student")
    public ResponseEntity<List<LessonAttemptsDTO>> getByStudent(@RequestBody Student student) {
        return ResponseEntity.ok(lessonAttemptsService.findByStudent(student));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @GetMapping("/lesson")
    public ResponseEntity<List<LessonAttemptsDTO>> getByLesson(@RequestBody Challenge lesson) {
        return ResponseEntity.ok(lessonAttemptsService.findByLesson(lesson));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @GetMapping("/wpm/{wpm}")
    public ResponseEntity<List<LessonAttemptsDTO>> getByWpm(@PathVariable Integer wpm) {
        return ResponseEntity.ok(lessonAttemptsService.findByWpm(wpm));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @GetMapping("/accuracy/{accuracy}")
    public ResponseEntity<List<LessonAttemptsDTO>> getByAccuracy(@PathVariable Integer accuracy) {
        return ResponseEntity.ok(lessonAttemptsService.findByAccuracy(accuracy));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @GetMapping("/completion-time/{completionTime}")
    public ResponseEntity<List<LessonAttemptsDTO>> getByCompletionTime(@PathVariable Integer completionTime) {
        return ResponseEntity.ok(lessonAttemptsService.findByCompletionTime(completionTime));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @GetMapping("/attempted-at/{attemptedAt}")
    public ResponseEntity<List<LessonAttemptsDTO>> getByAttemptedAt(@PathVariable String attemptedAt) {
        LocalDateTime dateTime = LocalDateTime.parse(attemptedAt);
        return ResponseEntity.ok(lessonAttemptsService.findByAttemptedAt(dateTime));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @PostMapping
    public ResponseEntity<LessonAttemptsDTO> createLessonAttempts(@RequestBody LessonAttemptsDTO lessonAttemptsDTO, @RequestParam Long studentId, @RequestParam Long lessonId) {
        Student student = new Student();
        student.setStudentId(studentId);
        Challenge lesson = new Challenge();
        lesson.setChallengeId(lessonId);
        return ResponseEntity.ok(lessonAttemptsService.save(lessonAttemptsDTO, student, lesson));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @PatchMapping("/{lessonAttemptsId}/wpm")
    public ResponseEntity<LessonAttemptsDTO> updateWpm(@PathVariable Long lessonAttemptsId, @RequestParam Integer newWpm) {
        LessonAttemptsDTO updated = lessonAttemptsService.updateWpm(lessonAttemptsId, newWpm);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @PatchMapping("/{lessonAttemptsId}/accuracy")
    public ResponseEntity<LessonAttemptsDTO> updateAccuracy(@PathVariable Long lessonAttemptsId, @RequestParam Integer newAccuracy) {
        LessonAttemptsDTO updated = lessonAttemptsService.updateAccuracy(lessonAttemptsId, newAccuracy);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @PatchMapping("/{lessonAttemptsId}/completion-time")
    public ResponseEntity<LessonAttemptsDTO> updateCompletionTime(@PathVariable Long lessonAttemptsId, @RequestParam Integer newCompletionTime) {
        LessonAttemptsDTO updated = lessonAttemptsService.updateCompletionTime(lessonAttemptsId, newCompletionTime);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @PatchMapping("/{lessonAttemptsId}/attempted-at")
    public ResponseEntity<LessonAttemptsDTO> updateAttemptedAt(@PathVariable Long lessonAttemptsId, @RequestParam String newAttemptedAt) {
        java.time.LocalDateTime attemptedAt = java.time.LocalDateTime.parse(newAttemptedAt);
        LessonAttemptsDTO updated = lessonAttemptsService.updateAttemptedAt(lessonAttemptsId, attemptedAt);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @PatchMapping("/{lessonAttemptsId}/student")
    public ResponseEntity<LessonAttemptsDTO> updateStudent(@PathVariable Long lessonAttemptsId, @RequestParam Long newStudentId) {
        Student newStudent = new Student();
        newStudent.setStudentId(newStudentId);
        LessonAttemptsDTO updated = lessonAttemptsService.updateStudent(lessonAttemptsId, newStudent);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @PatchMapping("/{lessonAttemptsId}/lesson")
    public ResponseEntity<LessonAttemptsDTO> updateLesson(@PathVariable Long lessonAttemptsId, @RequestParam Long newLessonId) {
        Challenge newLesson = new Challenge();
        newLesson.setChallengeId(newLessonId);
        LessonAttemptsDTO updated = lessonAttemptsService.updateLesson(lessonAttemptsId, newLesson);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable Long id) {
        lessonAttemptsService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
