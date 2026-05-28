package com.syntaxtype.demo.features.lesson.controller;

import com.syntaxtype.demo.features.lesson.dto.TopicsDTO;
import com.syntaxtype.demo.features.user.entity.Teacher;
import com.syntaxtype.demo.features.lesson.service.TopicsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/topics")
@RequiredArgsConstructor
public class TopicsController {
    private final TopicsService topicsService;

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @GetMapping
    public ResponseEntity<List<TopicsDTO>> getAllTopics() {
        return ResponseEntity.ok(topicsService.findAll());
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @GetMapping("/{topicId}")
    public ResponseEntity<Optional<TopicsDTO>> getById(@PathVariable Long topicId) {
        return ResponseEntity.ok(topicsService.findByTopicId(topicId));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @GetMapping("/name/{name}")
    public ResponseEntity<List<TopicsDTO>> getByName(@PathVariable String name) {
        return ResponseEntity.ok(topicsService.findByName(name));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @GetMapping("/description/{description}")
    public ResponseEntity<List<TopicsDTO>> getByDescription(@PathVariable String description) {
        return ResponseEntity.ok(topicsService.findByDescription(description));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @GetMapping("/created-by/{teacherId}")
    public ResponseEntity<List<TopicsDTO>> getByCreatedBy(@PathVariable Long teacherId) {
        Teacher teacher = new Teacher();
        teacher.setTeacherId(teacherId);
        return ResponseEntity.ok(topicsService.findByCreatedBy(teacher));
    }

    // Only teachers and admins can create/delete topics
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @PostMapping
    public ResponseEntity<TopicsDTO> createTopic(@RequestBody TopicsDTO topicsDTO, @RequestParam Long teacherId) {
        Teacher teacher = new Teacher();
        teacher.setTeacherId(teacherId);
        return ResponseEntity.ok(topicsService.save(topicsDTO, teacher));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @PatchMapping("/{topicId}/name")
    public ResponseEntity<TopicsDTO> updateName(@PathVariable Long topicId, @RequestParam String newName) {
        TopicsDTO updated = topicsService.updateName(topicId, newName);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @PatchMapping("/{topicId}/description")
    public ResponseEntity<TopicsDTO> updateDescription(@PathVariable Long topicId, @RequestParam String newDescription) {
        TopicsDTO updated = topicsService.updateDescription(topicId, newDescription);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @PatchMapping("/{topicId}/created-by")
    public ResponseEntity<TopicsDTO> updateCreatedBy(@PathVariable Long topicId, @RequestParam Long newTeacherId) {
        Teacher newTeacher = new Teacher();
        newTeacher.setTeacherId(newTeacherId);
        TopicsDTO updated = topicsService.updateCreatedBy(topicId, newTeacher);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable Long id) {
        topicsService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
