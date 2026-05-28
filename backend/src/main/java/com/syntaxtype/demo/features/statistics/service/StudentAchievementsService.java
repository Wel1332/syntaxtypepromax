package com.syntaxtype.demo.features.statistics.service;

import com.syntaxtype.demo.features.statistics.dto.StudentAchievementsDTO;
import com.syntaxtype.demo.features.statistics.entity.StudentAchievements;
import com.syntaxtype.demo.features.user.entity.Student;
import com.syntaxtype.demo.features.statistics.entity.Achievements;
import com.syntaxtype.demo.features.statistics.repository.StudentAchievementsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class StudentAchievementsService {
    private final StudentAchievementsRepository studentAchievementsRepository;

    public List<StudentAchievementsDTO> findAll() {
        return studentAchievementsRepository.findAll().stream()
                .map(this::convertToDTO)
                .toList();
    }

    public Optional<StudentAchievementsDTO> findByStudentAchievementId(Long studentAchievementId) {
        return studentAchievementsRepository.findById(studentAchievementId)
                .map(this::convertToDTO);
    }

    public List<StudentAchievementsDTO> findByStudent(Student student) {
        return studentAchievementsRepository.findByStudent(student).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<StudentAchievementsDTO> findByAchievementId(Achievements achievementId) {
        return studentAchievementsRepository.findByAchievementId(achievementId).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<StudentAchievementsDTO> findByAwardedAt(LocalDateTime awardedAt) {
        return studentAchievementsRepository.findByAwardedAt(awardedAt).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public StudentAchievementsDTO save(StudentAchievementsDTO dto, Student student, Achievements achievement) {
        StudentAchievements entity = convertFromDTO(dto, student, achievement);
        return convertToDTO(studentAchievementsRepository.save(entity));
    }

    // PATCH: Update student for a student achievement
    public StudentAchievementsDTO updateStudent(Long studentAchievementId, Student newStudent) {
        Optional<StudentAchievements> saOpt = studentAchievementsRepository.findById(studentAchievementId);
        if (saOpt.isPresent()) {
            StudentAchievements sa = saOpt.get();
            sa.setStudent(newStudent);
            return convertToDTO(studentAchievementsRepository.save(sa));
        }
        return null;
    }

    // PATCH: Update achievement for a student achievement
    public StudentAchievementsDTO updateAchievement(Long studentAchievementId, Achievements newAchievement) {
        Optional<StudentAchievements> saOpt = studentAchievementsRepository.findById(studentAchievementId);
        if (saOpt.isPresent()) {
            StudentAchievements sa = saOpt.get();
            sa.setAchievementId(newAchievement);
            return convertToDTO(studentAchievementsRepository.save(sa));
        }
        return null;
    }

    // PATCH: Update awardedAt for a student achievement
    public StudentAchievementsDTO updateAwardedAt(Long studentAchievementId, LocalDateTime newAwardedAt) {
        Optional<StudentAchievements> saOpt = studentAchievementsRepository.findById(studentAchievementId);
        if (saOpt.isPresent()) {
            StudentAchievements sa = saOpt.get();
            sa.setAwardedAt(newAwardedAt);
            return convertToDTO(studentAchievementsRepository.save(sa));
        }
        return null;
    }

    public void deleteById(Long id) {
        studentAchievementsRepository.deleteById(id);
    }

    public StudentAchievementsDTO convertToDTO(StudentAchievements entity) {
        if (entity == null) return null;
        return StudentAchievementsDTO.builder()
                .studentAchievementId(entity.getStudentAchievementId())
                .studentId(entity.getStudent() != null ? entity.getStudent().getStudentId() : null)
                .achievementId(entity.getAchievementId() != null ? entity.getAchievementId().getAchievementId() : null)
                .awardedAt(entity.getAwardedAt())
                .build();
    }

    public StudentAchievements convertFromDTO(StudentAchievementsDTO dto, Student student, Achievements achievement) {
        if (dto == null) return null;
        StudentAchievements entity = new StudentAchievements();
        entity.setStudentAchievementId(dto.getStudentAchievementId());
        entity.setStudent(student);
        entity.setAchievementId(achievement);
        entity.setAwardedAt(dto.getAwardedAt());
        return entity;
    }
}
