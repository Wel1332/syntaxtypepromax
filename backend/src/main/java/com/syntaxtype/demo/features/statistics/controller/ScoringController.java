package com.syntaxtype.demo.features.statistics.controller;

import com.syntaxtype.demo.features.statistics.dto.ScoringDTO;
import com.syntaxtype.demo.features.user.entity.User;
import com.syntaxtype.demo.core.enums.Category;
import com.syntaxtype.demo.features.statistics.service.ScoringService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/scorings")
@RequiredArgsConstructor
public class ScoringController {
    private final ScoringService scoringService;

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @GetMapping
    public ResponseEntity<List<ScoringDTO>> getAllScorings() {
        return ResponseEntity.ok(scoringService.findAll());
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @GetMapping("/{scoringId}")
    public ResponseEntity<Optional<ScoringDTO>> getById(@PathVariable Long scoringId) {
        return ResponseEntity.ok(scoringService.findByScoringId(scoringId));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @GetMapping("/user")
    public ResponseEntity<Optional<ScoringDTO>> getByUser(@RequestBody User user) {
        return ResponseEntity.ok(scoringService.findByUser(user));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @GetMapping("/total-score/{totalScore}")
    public ResponseEntity<List<ScoringDTO>> getByTotalScore(@PathVariable Integer totalScore) {
        return ResponseEntity.ok(scoringService.findByTotalScore(totalScore));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @GetMapping("/correct-answers/{correctAnswers}")
    public ResponseEntity<List<ScoringDTO>> getByCorrectAnswers(@PathVariable Integer correctAnswers) {
        return ResponseEntity.ok(scoringService.findByCorrectAnswers(correctAnswers));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @GetMapping("/wrong-answers/{wrongAnswers}")
    public ResponseEntity<List<ScoringDTO>> getByWrongAnswers(@PathVariable Integer wrongAnswers) {
        return ResponseEntity.ok(scoringService.findByWrongAnswers(wrongAnswers));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @GetMapping("/total-time-spent/{totalTimeSpent}")
    public ResponseEntity<List<ScoringDTO>> getByTotalTimeSpent(@PathVariable Integer totalTimeSpent) {
        return ResponseEntity.ok(scoringService.findByTotalTimeSpent(totalTimeSpent));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'USER')")
    @GetMapping("/average-time-spent-between-words/{averageTimeSpentBetweenWords}")
    public ResponseEntity<List<ScoringDTO>> getByAverageTimeSpentBetweenWords(@PathVariable Double averageTimeSpentBetweenWords) {
        return ResponseEntity.ok(scoringService.findByAverageTimeSpentBetweenWords(averageTimeSpentBetweenWords));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'USER')")
    @GetMapping("/answered-words/{answeredWords}")
    public ResponseEntity<List<ScoringDTO>> getByAnsweredWords(@RequestParam List<String> answeredWords) {
        return ResponseEntity.ok(scoringService.findByAnsweredWords(answeredWords));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'USER')")
    @GetMapping("/wrong-words/{wrongWords}")
    public ResponseEntity<List<ScoringDTO>> getByWrongWords(@RequestParam List<String> wrongWords) {
        return ResponseEntity.ok(scoringService.findByWrongWords(wrongWords));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @GetMapping("/category/{category}")
    public ResponseEntity<List<ScoringDTO>> getByCategory(@PathVariable Category category) {
        return ResponseEntity.ok(scoringService.findByCategory(category));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @PostMapping
    public ResponseEntity<ScoringDTO> createScoring(@RequestBody ScoringDTO scoringDTO, @RequestParam Long userId) {
        User user = new User();
        user.setUserId(userId);
        return ResponseEntity.ok(scoringService.save(scoringDTO, user));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @PatchMapping("/{scoringId}/words-per-minute")
    public ResponseEntity<ScoringDTO> updateTotalScore(@PathVariable Long scoringId, @RequestParam Integer newTotalScore) {
        ScoringDTO updated = scoringService.updateTotalScore(scoringId, newTotalScore);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @PatchMapping("/{scoringId}/correct-answers")
    public ResponseEntity<ScoringDTO> updateCorrectAnswers(@PathVariable Long scoringId, @RequestParam Integer newCorrectAnswers) {
        ScoringDTO updated = scoringService.updateCorrectAnswers(scoringId, newCorrectAnswers);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @PatchMapping("/{scoringId}/wrong-answers")
    public ResponseEntity<ScoringDTO> updateWrongAnswers(@PathVariable Long scoringId, @RequestParam Integer newWrongAnswers) {
        ScoringDTO updated = scoringService.updateWrongAnswers(scoringId, newWrongAnswers);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @PatchMapping("/{scoringId}/total-time-spent")
    public ResponseEntity<ScoringDTO> updateTotalTimeSpent(@PathVariable Long scoringId, @RequestParam Integer newTotalTimeSpent) {
        ScoringDTO updated = scoringService.updateTotalTimeSpent(scoringId, newTotalTimeSpent);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @PatchMapping("/{scoringId}/average-time")
    public ResponseEntity<ScoringDTO> updateAverageTimeSpentBetweenWords(@PathVariable Long scoringId, @RequestParam Double newAverageTime) {
        ScoringDTO updated = scoringService.updateAverageTimeSpentBetweenWords(scoringId, newAverageTime);
        if(updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @PatchMapping("/{scoringId}/answered-words")
    public ResponseEntity<ScoringDTO> updateAnsweredWords(@PathVariable Long scoringId, @RequestParam List<String> newAnsweredWords) {
        ScoringDTO updated = scoringService.updateAnsweredWords(scoringId, newAnsweredWords);
        if(updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @PatchMapping("/{scoringId}/wrong-words")
    public ResponseEntity<ScoringDTO> updateWrongWords(@PathVariable Long scoringId, @RequestParam List<String> newWrongWords) {
        ScoringDTO updated = scoringService.updateWrongWords(scoringId, newWrongWords);
        if(updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    // @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    // @PatchMapping("/{scoringId}/")
    // public 

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @PatchMapping("/{scoringId}/category")
    public ResponseEntity<ScoringDTO> updateCategory(@PathVariable Long scoringId, @RequestParam Category newCategory) {
        ScoringDTO updated = scoringService.updateCategory(scoringId, newCategory);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable Long id) {
        scoringService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
