package com.syntaxtype.demo.features.classroom.controller;

import com.syntaxtype.demo.core.security.CustomUserDetails;
import com.syntaxtype.demo.features.classroom.dto.ChallengeAttemptRequest;
import com.syntaxtype.demo.features.classroom.dto.ChallengeAttemptResultDTO;
import com.syntaxtype.demo.features.classroom.dto.ClassChallengeDTO;
import com.syntaxtype.demo.features.classroom.dto.ClassChallengeRequest;
import com.syntaxtype.demo.features.classroom.dto.ClassChallengeResultsDTO;
import com.syntaxtype.demo.features.classroom.service.ClassChallengeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Class challenges. Teachers manage them under the class they belong to; students
 * reach the ones from classes they joined under /api/class-challenges. The role
 * checks here only pick the side; ClassChallengeService enforces ownership and
 * enrollment for every call.
 */
@RestController
@RequiredArgsConstructor
public class ClassChallengeController {

    private final ClassChallengeService service;

    // ── Teacher (class owner) or admin ────────────────────────────────────

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping("/api/classes/{classroomId}/challenges")
    public ResponseEntity<List<ClassChallengeDTO>> list(
            @PathVariable Long classroomId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(service.listForClass(classroomId, principal.getUser()));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @PostMapping("/api/classes/{classroomId}/challenges")
    public ResponseEntity<ClassChallengeDTO> create(
            @PathVariable Long classroomId,
            @RequestBody ClassChallengeRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(service.create(classroomId, principal.getUser(), request));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping("/api/classes/{classroomId}/challenges/{challengeId}")
    public ResponseEntity<ClassChallengeDTO> get(
            @PathVariable Long classroomId,
            @PathVariable Long challengeId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(service.getForTeacher(classroomId, challengeId, principal.getUser()));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @PutMapping("/api/classes/{classroomId}/challenges/{challengeId}")
    public ResponseEntity<ClassChallengeDTO> update(
            @PathVariable Long classroomId,
            @PathVariable Long challengeId,
            @RequestBody ClassChallengeRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(service.update(classroomId, challengeId, principal.getUser(), request));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping("/api/classes/{classroomId}/challenges/{challengeId}/results")
    public ResponseEntity<ClassChallengeResultsDTO> results(
            @PathVariable Long classroomId,
            @PathVariable Long challengeId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(service.results(classroomId, challengeId, principal.getUser()));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @DeleteMapping("/api/classes/{classroomId}/challenges/{challengeId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long classroomId,
            @PathVariable Long challengeId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        service.delete(classroomId, challengeId, principal.getUser());
        return ResponseEntity.noContent().build();
    }

    // ── Students who joined the class ─────────────────────────────────────

    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/api/class-challenges")
    public ResponseEntity<List<ClassChallengeDTO>> myChallenges(
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(service.listForStudent(principal.getUser()));
    }

    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/api/class-challenges/{challengeId}")
    public ResponseEntity<ClassChallengeDTO> play(
            @PathVariable Long challengeId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(service.getForStudent(challengeId, principal.getUser()));
    }

    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/api/class-challenges/{challengeId}/attempts")
    public ResponseEntity<ChallengeAttemptResultDTO> submitAttempt(
            @PathVariable Long challengeId,
            @RequestBody ChallengeAttemptRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(service.recordAttempt(challengeId, principal.getUser(), request));
    }
}
