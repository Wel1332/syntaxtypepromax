package com.syntaxtype.demo.features.lesson.controller;

import com.syntaxtype.demo.features.lesson.dto.LessonsDTO;
import com.syntaxtype.demo.features.lesson.service.LessonsService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/lessons")
@RequiredArgsConstructor
public class LessonsController {

    private final LessonsService lessonsService;


    /*@PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")*/
    @GetMapping
    public ResponseEntity<List<LessonsDTO>> getAllLessons() {
        return ResponseEntity.ok(lessonsService.findAll());
    }


    /*@PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")*/
    @GetMapping("/{lessonId}")
    public ResponseEntity<Optional<LessonsDTO>> getById(@PathVariable Long lessonId) {
        return ResponseEntity.ok(lessonsService.findByLessonId(lessonId));
    }

    /*@PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")*/
    @GetMapping("/title/{title}")
    public ResponseEntity<List<LessonsDTO>> getByTitle(@PathVariable String title) {
        return ResponseEntity.ok(lessonsService.findByTitle(title));
    }


    /*@PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")*/
    @PostMapping
    public ResponseEntity<LessonsDTO> createLesson(@RequestBody LessonsDTO lessonDTO) {
        LessonsDTO savedLesson = lessonsService.save(lessonDTO); // FIXED: saving it
        return ResponseEntity.ok(savedLesson);                   // return the saved object
    }


    /*@PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")*/
    @PatchMapping("/{lessonId}/title")
    public ResponseEntity<LessonsDTO> updateTitle(@PathVariable Long lessonId, @RequestParam String newTitle) {
        LessonsDTO updated = lessonsService.updateTitle(lessonId, newTitle);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }


    /*@PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")*/
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteById(@PathVariable Long id) {
        try {
            lessonsService.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Unexpected error");
        }
    }
    @PutMapping("/{lessonId}")
    public ResponseEntity<LessonsDTO> updateLesson(@PathVariable Long lessonId, @RequestBody LessonsDTO lessonDTO) {
        LessonsDTO updatedLesson = lessonsService.updateLesson(lessonId, lessonDTO);
        return updatedLesson != null
                ? ResponseEntity.ok(updatedLesson)
                : ResponseEntity.notFound().build();
    }
}
