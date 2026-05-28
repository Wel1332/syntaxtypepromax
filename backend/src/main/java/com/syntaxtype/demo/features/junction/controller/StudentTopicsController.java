package com.syntaxtype.demo.features.junction.controller;

import com.syntaxtype.demo.features.junction.dto.StudentTopicsDTO;
import com.syntaxtype.demo.features.junction.entity.compositekeys.StudentTopicsId;
import com.syntaxtype.demo.features.user.entity.Student;
import com.syntaxtype.demo.features.lesson.entity.Topics;
import com.syntaxtype.demo.features.junction.service.StudentTopicsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student-topics")
@RequiredArgsConstructor
public class StudentTopicsController {
    private final StudentTopicsService studentTopicsService;

    @GetMapping
    public List<StudentTopicsDTO> getAllStudentTopics() {
        return studentTopicsService.findAll();
    }

    @GetMapping("/student/{studentId}")
    public List<StudentTopicsDTO> getByStudent(@PathVariable Long studentId) {
        Student student = new Student();
        student.setStudentId(studentId);
        return studentTopicsService.findByStudent(student);
    }

    @GetMapping("/topic/{topicId}")
    public List<StudentTopicsDTO> getByTopic(@PathVariable Long topicId) {
        Topics topic = new Topics();
        topic.setTopicId(topicId);
        return studentTopicsService.findByTopic(topic);
    }

    @PostMapping
    public StudentTopicsDTO createStudentTopics(@RequestBody StudentTopicsDTO dto) {
        Student student = new Student();
        student.setStudentId(dto.getStudentId());
        Topics topic = new Topics();
        topic.setTopicId(dto.getTopicId());
        return studentTopicsService.save(dto, student, topic);
    }

    @PatchMapping("/{studentId}/{topicId}/student")
    public StudentTopicsDTO updateStudent(@PathVariable Long studentId, @PathVariable Long topicId, @RequestBody Long newStudentId) {
        StudentTopicsId id = new StudentTopicsId(studentId, topicId);
        Student newStudent = new Student();
        newStudent.setStudentId(newStudentId);
        return studentTopicsService.updateStudent(id, newStudent);
    }

    @PatchMapping("/{studentId}/{topicId}/topic")
    public StudentTopicsDTO updateTopic(@PathVariable Long studentId, @PathVariable Long topicId, @RequestBody Long newTopicId) {
        StudentTopicsId id = new StudentTopicsId(studentId, topicId);
        Topics newTopic = new Topics();
        newTopic.setTopicId(newTopicId);
        return studentTopicsService.updateTopic(id, newTopic);
    }

    @DeleteMapping("/{studentId}/{topicId}")
    public void deleteStudentTopics(@PathVariable Long studentId, @PathVariable Long topicId) {
        StudentTopicsId id = new StudentTopicsId(studentId, topicId);
        studentTopicsService.deleteById(id);
    }
}
