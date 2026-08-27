package com.syntaxtype.demo.features.junction.controller;

import com.syntaxtype.demo.features.junction.dto.TeacherTopicsDTO;
import com.syntaxtype.demo.features.junction.entity.compositekeys.TeacherTopicsId;
import com.syntaxtype.demo.features.user.entity.Teacher;
import com.syntaxtype.demo.features.lesson.entity.Topics;
import com.syntaxtype.demo.features.junction.service.TeacherTopicsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Like StudentTopicsController, this carried no authorization: any account created through
 * the public registration endpoint could read, reassign or delete teacher-topic links.
 *
 * No screen in the frontend calls any of these endpoints, so this is surface with no
 * consumer. Restricting it to staff is the conservative fix; deleting the controller
 * outright is the cheaper one, and worth doing once someone confirms no external client
 * depends on it.
 */
@RestController
@RequestMapping("/api/teacher-topics")
@RequiredArgsConstructor
public class TeacherTopicsController {
    private final TeacherTopicsService teacherTopicsService;

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping
    public List<TeacherTopicsDTO> getAllTeacherTopics() {
        return teacherTopicsService.findAll();
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping("/teacher/{teacherId}")
    public List<TeacherTopicsDTO> getByTeacher(@PathVariable Long teacherId) {
        Teacher teacher = new Teacher();
        teacher.setTeacherId(teacherId);
        return teacherTopicsService.findByTeacher(teacher);
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping("/topic/{topicId}")
    public List<TeacherTopicsDTO> getByTopic(@PathVariable Long topicId) {
        Topics topic = new Topics();
        topic.setTopicId(topicId);
        return teacherTopicsService.findByTopic(topic);
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @PostMapping
    public TeacherTopicsDTO createTeacherTopics(@RequestBody TeacherTopicsDTO dto) {
        Teacher teacher = new Teacher();
        teacher.setTeacherId(dto.getTeacherId());
        Topics topic = new Topics();
        topic.setTopicId(dto.getTopicId());
        return teacherTopicsService.save(dto, teacher, topic);
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @PatchMapping("/{teacherId}/{topicId}/teacher")
    public TeacherTopicsDTO updateTeacher(@PathVariable Long teacherId, @PathVariable Long topicId, @RequestBody Long newTeacherId) {
        TeacherTopicsId id = new TeacherTopicsId(teacherId, topicId);
        Teacher newTeacher = new Teacher();
        newTeacher.setTeacherId(newTeacherId);
        return teacherTopicsService.updateTeacher(id, newTeacher);
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @PatchMapping("/{teacherId}/{topicId}/topic")
    public TeacherTopicsDTO updateTopic(@PathVariable Long teacherId, @PathVariable Long topicId, @RequestBody Long newTopicId) {
        TeacherTopicsId id = new TeacherTopicsId(teacherId, topicId);
        Topics newTopic = new Topics();
        newTopic.setTopicId(newTopicId);
        return teacherTopicsService.updateTopic(id, newTopic);
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @DeleteMapping("/{teacherId}/{topicId}")
    public void deleteTeacherTopics(@PathVariable Long teacherId, @PathVariable Long topicId) {
        TeacherTopicsId id = new TeacherTopicsId(teacherId, topicId);
        teacherTopicsService.deleteById(id);
    }
}
