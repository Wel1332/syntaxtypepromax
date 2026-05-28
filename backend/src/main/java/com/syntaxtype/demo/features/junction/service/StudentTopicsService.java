package com.syntaxtype.demo.features.junction.service;

import com.syntaxtype.demo.features.junction.dto.StudentTopicsDTO;
import com.syntaxtype.demo.features.junction.entity.compositekeys.StudentTopicsId;
import com.syntaxtype.demo.features.junction.entity.StudentTopics;
import com.syntaxtype.demo.features.user.entity.Student;
import com.syntaxtype.demo.features.lesson.entity.Topics;
import com.syntaxtype.demo.features.junction.repository.StudentTopicsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class StudentTopicsService {
    private final StudentTopicsRepository studentTopicsRepository;

    public List<StudentTopicsDTO> findAll() {
        return studentTopicsRepository.findAll().stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<StudentTopicsDTO> findByStudent(Student student) {
        return studentTopicsRepository.findByStudent(student).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<StudentTopicsDTO> findByTopic(Topics topic) {
        return studentTopicsRepository.findByTopic(topic).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public StudentTopicsDTO save(StudentTopicsDTO dto, Student student, Topics topic) {
        StudentTopics entity = convertFromDTO(dto, student, topic);
        return convertToDTO(studentTopicsRepository.save(entity));
    }

    // PATCH: Update student in StudentTopics
    public StudentTopicsDTO updateStudent(StudentTopicsId id, Student newStudent) {
        Optional<StudentTopics> stOpt = studentTopicsRepository.findById(id);
        if (stOpt.isPresent()) {
            StudentTopics st = stOpt.get();
            st.setStudent(newStudent);
            return convertToDTO(studentTopicsRepository.save(st));
        }
        return null;
    }

    // PATCH: Update topic in StudentTopics
    public StudentTopicsDTO updateTopic(StudentTopicsId id, Topics newTopic) {
        Optional<StudentTopics> stOpt = studentTopicsRepository.findById(id);
        if (stOpt.isPresent()) {
            StudentTopics st = stOpt.get();
            st.setTopic(newTopic);
            return convertToDTO(studentTopicsRepository.save(st));
        }
        return null;
    }

    public void deleteById(StudentTopicsId id) {
        studentTopicsRepository.deleteById(id);
    }

    public boolean exists(Student student, Topics topic) {
        return studentTopicsRepository.existsByStudentAndTopic(student, topic);
    }

    public StudentTopicsDTO convertToDTO(StudentTopics entity) {
        if (entity == null) return null;
        return StudentTopicsDTO.builder()
                .studentId(entity.getStudent() != null ? entity.getStudent().getStudentId() : null)
                .topicId(entity.getTopic() != null ? entity.getTopic().getTopicId() : null)
                .build();
    }

    public StudentTopics convertFromDTO(StudentTopicsDTO dto, Student student, Topics topic) {
        if (dto == null) return null;
        StudentTopics entity = new StudentTopics();
        entity.setStudent(student);
        entity.setTopic(topic);
        return entity;
    }
}
