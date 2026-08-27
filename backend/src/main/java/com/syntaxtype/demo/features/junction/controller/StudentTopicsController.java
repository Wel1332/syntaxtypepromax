package com.syntaxtype.demo.features.junction.controller;

import com.syntaxtype.demo.core.security.AccessGuard;
import com.syntaxtype.demo.core.security.CustomUserDetails;
import com.syntaxtype.demo.features.junction.dto.StudentTopicsDTO;
import com.syntaxtype.demo.features.junction.entity.compositekeys.StudentTopicsId;
import com.syntaxtype.demo.features.user.entity.Student;
import com.syntaxtype.demo.features.lesson.entity.Topics;
import com.syntaxtype.demo.features.junction.service.StudentTopicsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * This controller carried no authorization at all. SecurityConfig requires authentication for
 * /api/**, but registration is public, so "authenticated" meant anyone who signed up: they
 * could read every student's topic progress, reassign a row to another student, or delete it.
 *
 * Assigning a topic to a student is a teaching action, so writes are staff-only. Reads of one
 * student's progress are staff-or-self.
 */
@RestController
@RequestMapping("/api/student-topics")
@RequiredArgsConstructor
public class StudentTopicsController {
    private final StudentTopicsService studentTopicsService;

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping
    public List<StudentTopicsDTO> getAllStudentTopics() {
        return studentTopicsService.findAll();
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @GetMapping("/student/{studentId}")
    public List<StudentTopicsDTO> getByStudent(
            @PathVariable Long studentId,
            @AuthenticationPrincipal CustomUserDetails caller) {
        AccessGuard.requireSelfOrStaff(studentId, caller, "topic progress");
        Student student = new Student();
        student.setStudentId(studentId);
        return studentTopicsService.findByStudent(student);
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping("/topic/{topicId}")
    public List<StudentTopicsDTO> getByTopic(@PathVariable Long topicId) {
        Topics topic = new Topics();
        topic.setTopicId(topicId);
        return studentTopicsService.findByTopic(topic);
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @PostMapping
    public StudentTopicsDTO createStudentTopics(@RequestBody StudentTopicsDTO dto) {
        Student student = new Student();
        student.setStudentId(dto.getStudentId());
        Topics topic = new Topics();
        topic.setTopicId(dto.getTopicId());
        return studentTopicsService.save(dto, student, topic);
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @PatchMapping("/{studentId}/{topicId}/student")
    public StudentTopicsDTO updateStudent(@PathVariable Long studentId, @PathVariable Long topicId, @RequestBody Long newStudentId) {
        StudentTopicsId id = new StudentTopicsId(studentId, topicId);
        Student newStudent = new Student();
        newStudent.setStudentId(newStudentId);
        return studentTopicsService.updateStudent(id, newStudent);
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @PatchMapping("/{studentId}/{topicId}/topic")
    public StudentTopicsDTO updateTopic(@PathVariable Long studentId, @PathVariable Long topicId, @RequestBody Long newTopicId) {
        StudentTopicsId id = new StudentTopicsId(studentId, topicId);
        Topics newTopic = new Topics();
        newTopic.setTopicId(newTopicId);
        return studentTopicsService.updateTopic(id, newTopic);
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @DeleteMapping("/{studentId}/{topicId}")
    public void deleteStudentTopics(@PathVariable Long studentId, @PathVariable Long topicId) {
        StudentTopicsId id = new StudentTopicsId(studentId, topicId);
        studentTopicsService.deleteById(id);
    }
}
