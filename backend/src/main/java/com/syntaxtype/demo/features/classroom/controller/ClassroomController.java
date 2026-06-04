package com.syntaxtype.demo.features.classroom.controller;

import com.syntaxtype.demo.core.security.CustomUserDetails;
import com.syntaxtype.demo.features.classroom.dto.ClassroomDTO;
import com.syntaxtype.demo.features.classroom.dto.CreateClassRequest;
import com.syntaxtype.demo.features.classroom.dto.JoinClassRequest;
import com.syntaxtype.demo.features.classroom.service.ClassroomService;
import com.syntaxtype.demo.features.user.dto.StudentDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
public class ClassroomController {
    private final ClassroomService classroomService;

    // ── Teacher endpoints ─────────────────────────────────────────────────

    /** Create a new class. A unique join code is generated server-side. */
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @PostMapping
    public ResponseEntity<ClassroomDTO> createClass(
            @RequestBody CreateClassRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(classroomService.createClass(userDetails.getUser(), request));
    }

    /** Classes created by the signed-in teacher. */
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping("/mine")
    public ResponseEntity<List<ClassroomDTO>> getMyClasses(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(classroomService.findMyClasses(userDetails.getUser()));
    }

    /** Roster of students enrolled in a class the teacher owns. */
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping("/{classroomId}/students")
    public ResponseEntity<List<StudentDTO>> getRoster(
            @PathVariable Long classroomId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(classroomService.getRoster(classroomId, userDetails.getUser()));
    }

    /** Remove a student from a class the teacher owns. */
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @DeleteMapping("/{classroomId}/students/{studentId}")
    public ResponseEntity<Void> removeStudent(
            @PathVariable Long classroomId,
            @PathVariable Long studentId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        classroomService.removeStudent(classroomId, studentId, userDetails.getUser());
        return ResponseEntity.noContent().build();
    }

    /** Delete a class the teacher owns (and its enrollments). */
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @DeleteMapping("/{classroomId}")
    public ResponseEntity<Void> deleteClass(
            @PathVariable Long classroomId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        classroomService.deleteClass(classroomId, userDetails.getUser());
        return ResponseEntity.noContent().build();
    }

    // ── Student endpoints ─────────────────────────────────────────────────

    /** Join a class by entering its code. */
    @PreAuthorize("hasAnyRole('ADMIN','STUDENT')")
    @PostMapping("/join")
    public ResponseEntity<ClassroomDTO> joinClass(
            @RequestBody JoinClassRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(classroomService.joinClass(userDetails.getUser(), request.getClassCode()));
    }

    /** Classes the signed-in student has joined. */
    @PreAuthorize("hasAnyRole('ADMIN','STUDENT')")
    @GetMapping("/enrolled")
    public ResponseEntity<List<ClassroomDTO>> getEnrolledClasses(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(classroomService.findEnrolledClasses(userDetails.getUser()));
    }
}
