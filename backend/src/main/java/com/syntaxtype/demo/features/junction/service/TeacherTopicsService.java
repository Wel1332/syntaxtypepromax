package com.syntaxtype.demo.features.junction.service;

import com.syntaxtype.demo.features.junction.dto.TeacherTopicsDTO;
import com.syntaxtype.demo.features.junction.entity.compositekeys.TeacherTopicsId;
import com.syntaxtype.demo.features.junction.entity.TeacherTopics;
import com.syntaxtype.demo.features.user.entity.Teacher;
import com.syntaxtype.demo.features.lesson.entity.Topics;
import com.syntaxtype.demo.features.junction.repository.TeacherTopicsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TeacherTopicsService {
    private final TeacherTopicsRepository teacherTopicsRepository;

    public List<TeacherTopicsDTO> findAll() {
        return teacherTopicsRepository.findAll().stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<TeacherTopicsDTO> findByTeacher(Teacher teacher) {
        return teacherTopicsRepository.findByTeacher(teacher).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<TeacherTopicsDTO> findByTopic(Topics topic) {
        return teacherTopicsRepository.findByTopic(topic).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public TeacherTopicsDTO save(TeacherTopicsDTO dto, Teacher teacher, Topics topic) {
        TeacherTopics entity = convertFromDTO(dto, teacher, topic);
        return convertToDTO(teacherTopicsRepository.save(entity));
    }

    // PATCH: Update teacher in TeacherTopics
    public TeacherTopicsDTO updateTeacher(TeacherTopicsId id, Teacher newTeacher) {
        Optional<TeacherTopics> ttOpt = teacherTopicsRepository.findById(id);
        if (ttOpt.isPresent()) {
            TeacherTopics tt = ttOpt.get();
            tt.setTeacher(newTeacher);
            return convertToDTO(teacherTopicsRepository.save(tt));
        }
        return null;
    }

    // PATCH: Update topic in TeacherTopics
    public TeacherTopicsDTO updateTopic(TeacherTopicsId id, Topics newTopic) {
        Optional<TeacherTopics> ttOpt = teacherTopicsRepository.findById(id);
        if (ttOpt.isPresent()) {
            TeacherTopics tt = ttOpt.get();
            tt.setTopic(newTopic);
            return convertToDTO(teacherTopicsRepository.save(tt));
        }
        return null;
    }

    public void deleteById(TeacherTopicsId id) {
        teacherTopicsRepository.deleteById(id);
    }

    public boolean exists(Teacher teacher, Topics topic) {
        return teacherTopicsRepository.existsByTeacherAndTopic(teacher, topic);
    }

    public TeacherTopicsDTO convertToDTO(TeacherTopics entity) {
        if (entity == null) return null;
        return TeacherTopicsDTO.builder()
                .teacherId(entity.getTeacher() != null ? entity.getTeacher().getTeacherId() : null)
                .topicId(entity.getTopic() != null ? entity.getTopic().getTopicId() : null)
                .build();
    }

    public TeacherTopics convertFromDTO(TeacherTopicsDTO dto, Teacher teacher, Topics topic) {
        if (dto == null) return null;
        TeacherTopics entity = new TeacherTopics();
        entity.setTeacher(teacher);
        entity.setTopic(topic);
        return entity;
    }
}