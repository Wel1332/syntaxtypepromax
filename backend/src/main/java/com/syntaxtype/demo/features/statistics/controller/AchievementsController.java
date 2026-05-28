package com.syntaxtype.demo.features.statistics.controller;

import com.syntaxtype.demo.features.statistics.dto.AchievementsDTO;
import com.syntaxtype.demo.features.user.entity.Teacher;
import com.syntaxtype.demo.features.lesson.entity.Topics;
import com.syntaxtype.demo.features.statistics.service.AchievementsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/achievements")
@RequiredArgsConstructor
public class AchievementsController {
    private final AchievementsService achievementsService;

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping
    public ResponseEntity<List<AchievementsDTO>> getAllAchievements() {
        return ResponseEntity.ok(achievementsService.findAll());
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping("/{achievementId}")
    public ResponseEntity<Optional<AchievementsDTO>> getById(@PathVariable Long achievementId) {
        return ResponseEntity.ok(achievementsService.findByAchievementId(achievementId));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping("/name/{name}")
    public ResponseEntity<List<AchievementsDTO>> getByName(@PathVariable String name) {
        return ResponseEntity.ok(achievementsService.findByName(name));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping("/description/{description}")
    public ResponseEntity<List<AchievementsDTO>> getByDescription(@PathVariable String description) {
        return ResponseEntity.ok(achievementsService.findByDescription(description));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping("/created-by/{teacherId}")
    public ResponseEntity<List<AchievementsDTO>> getByCreatedBy(@PathVariable Long teacherId) {
        Teacher teacher = new Teacher();
        teacher.setTeacherId(teacherId);
        return ResponseEntity.ok(achievementsService.findByCreatedBy(teacher));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping("/topic/{topicId}")
    public ResponseEntity<List<AchievementsDTO>> getByTopicId(@PathVariable Long topicId) {
        Topics topic = new Topics();
        topic.setTopicId(topicId);
        return ResponseEntity.ok(achievementsService.findByTopicId(topic));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping("/created-at/{createdAt}")
    public ResponseEntity<List<AchievementsDTO>> getByCreatedAt(@PathVariable String createdAt) {
        LocalDateTime dateTime = LocalDateTime.parse(createdAt);
        return ResponseEntity.ok(achievementsService.findByCreatedAt(dateTime));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping("/trigger-type/{triggerType}")
    public ResponseEntity<List<AchievementsDTO>> getByTriggerType(@PathVariable String triggerType) {
        return ResponseEntity.ok(achievementsService.findByTriggerType(triggerType));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping("/trigger-value/{triggerValue}")
    public ResponseEntity<List<AchievementsDTO>> getByTriggerValue(@PathVariable Integer triggerValue) {
        return ResponseEntity.ok(achievementsService.findByTriggerValue(triggerValue));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @PostMapping
    public ResponseEntity<AchievementsDTO> createAchievement(@RequestBody AchievementsDTO dto, @RequestParam Long teacherId, @RequestParam Long topicId) {
        Teacher teacher = new Teacher();
        teacher.setTeacherId(teacherId);
        Topics topic = new Topics();
        topic.setTopicId(topicId);
        return ResponseEntity.ok(achievementsService.save(dto, teacher, topic));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @PatchMapping("/{achievementId}/name")
    public ResponseEntity<AchievementsDTO> updateName(@PathVariable Long achievementId, @RequestParam String newName) {
        AchievementsDTO updated = achievementsService.updateName(achievementId, newName);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @PatchMapping("/{achievementId}/description")
    public ResponseEntity<AchievementsDTO> updateDescription(@PathVariable Long achievementId, @RequestParam String newDescription) {
        AchievementsDTO updated = achievementsService.updateDescription(achievementId, newDescription);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @PatchMapping("/{achievementId}/created-by")
    public ResponseEntity<AchievementsDTO> updateCreatedBy(@PathVariable Long achievementId, @RequestParam Long newTeacherId) {
        Teacher newTeacher = new Teacher();
        newTeacher.setTeacherId(newTeacherId);
        AchievementsDTO updated = achievementsService.updateCreatedBy(achievementId, newTeacher);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @PatchMapping("/{achievementId}/topic")
    public ResponseEntity<AchievementsDTO> updateTopic(@PathVariable Long achievementId, @RequestParam Long newTopicId) {
        Topics newTopic = new Topics();
        newTopic.setTopicId(newTopicId);
        AchievementsDTO updated = achievementsService.updateTopic(achievementId, newTopic);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @PatchMapping("/{achievementId}/created-at")
    public ResponseEntity<AchievementsDTO> updateCreatedAt(@PathVariable Long achievementId, @RequestParam String newCreatedAt) {
        java.time.LocalDateTime createdAt = java.time.LocalDateTime.parse(newCreatedAt);
        AchievementsDTO updated = achievementsService.updateCreatedAt(achievementId, createdAt);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @PatchMapping("/{achievementId}/trigger-type")
    public ResponseEntity<AchievementsDTO> updateTriggerType(@PathVariable Long achievementId, @RequestParam String newTriggerType) {
        AchievementsDTO updated = achievementsService.updateTriggerType(achievementId, newTriggerType);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @PatchMapping("/{achievementId}/trigger-value")
    public ResponseEntity<AchievementsDTO> updateTriggerValue(@PathVariable Long achievementId, @RequestParam Integer newTriggerValue) {
        AchievementsDTO updated = achievementsService.updateTriggerValue(achievementId, newTriggerValue);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable Long id) {
        achievementsService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
