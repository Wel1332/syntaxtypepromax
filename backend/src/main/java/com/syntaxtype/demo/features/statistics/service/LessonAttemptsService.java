package com.syntaxtype.demo.features.statistics.service;

import com.syntaxtype.demo.features.statistics.dto.LessonAttemptsDTO;
import com.syntaxtype.demo.features.statistics.entity.LessonAttempts;
import com.syntaxtype.demo.features.user.entity.Student;
import com.syntaxtype.demo.features.lesson.entity.Challenge;
import com.syntaxtype.demo.features.statistics.repository.LessonAttemptsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class LessonAttemptsService {
    private final LessonAttemptsRepository lessonAttemptsRepository;

    public List<LessonAttemptsDTO> findAll() {
        return lessonAttemptsRepository.findAll().stream()
                .map(this::convertToDTO)
                .toList();
    }

    public Optional<LessonAttemptsDTO> findById(Long lessonAttemptsId) {
        return lessonAttemptsRepository.findById(lessonAttemptsId)
                .map(this::convertToDTO);
    }

    public List<LessonAttemptsDTO> findByStudent(Student student) {
        return lessonAttemptsRepository.findByStudent(student).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<LessonAttemptsDTO> findByLesson(Challenge lesson) {
        return lessonAttemptsRepository.findByLesson(lesson).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<LessonAttemptsDTO> findByWpm(Integer wpm) {
        return lessonAttemptsRepository.findByWpm(wpm).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<LessonAttemptsDTO> findByAccuracy(Integer accuracy) {
        return lessonAttemptsRepository.findByAccuracy(accuracy).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<LessonAttemptsDTO> findByCompletionTime(Integer completionTime) {
        return lessonAttemptsRepository.findByCompletionTime(completionTime).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<LessonAttemptsDTO> findByAttemptedAt(LocalDateTime attemptedAt) {
        return lessonAttemptsRepository.findByAttemptedAt(attemptedAt).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public LessonAttemptsDTO save(LessonAttemptsDTO lessonAttemptsDTO, Student student, Challenge lesson) {
        LessonAttempts lessonAttempts = convertFromDTO(lessonAttemptsDTO, student, lesson);
        return convertToDTO(lessonAttemptsRepository.save(lessonAttempts));
    }

    // PATCH: Update WPM
    public LessonAttemptsDTO updateWpm(Long lessonAttemptsId, Integer newWpm) {
        Optional<LessonAttempts> laOpt = lessonAttemptsRepository.findById(lessonAttemptsId);
        if (laOpt.isPresent()) {
            LessonAttempts la = laOpt.get();
            la.setWpm(newWpm);
            return convertToDTO(lessonAttemptsRepository.save(la));
        }
        return null;
    }

    // PATCH: Update accuracy
    public LessonAttemptsDTO updateAccuracy(Long lessonAttemptsId, Integer newAccuracy) {
        Optional<LessonAttempts> laOpt = lessonAttemptsRepository.findById(lessonAttemptsId);
        if (laOpt.isPresent()) {
            LessonAttempts la = laOpt.get();
            la.setAccuracy(newAccuracy);
            return convertToDTO(lessonAttemptsRepository.save(la));
        }
        return null;
    }

    // PATCH: Update completion time
    public LessonAttemptsDTO updateCompletionTime(Long lessonAttemptsId, Integer newCompletionTime) {
        Optional<LessonAttempts> laOpt = lessonAttemptsRepository.findById(lessonAttemptsId);
        if (laOpt.isPresent()) {
            LessonAttempts la = laOpt.get();
            la.setCompletionTime(newCompletionTime);
            return convertToDTO(lessonAttemptsRepository.save(la));
        }
        return null;
    }

    // PATCH: Update attemptedAt
    public LessonAttemptsDTO updateAttemptedAt(Long lessonAttemptsId, java.time.LocalDateTime newAttemptedAt) {
        Optional<LessonAttempts> laOpt = lessonAttemptsRepository.findById(lessonAttemptsId);
        if (laOpt.isPresent()) {
            LessonAttempts la = laOpt.get();
            la.setAttemptedAt(newAttemptedAt);
            return convertToDTO(lessonAttemptsRepository.save(la));
        }
        return null;
    }

    // PATCH: Update student
    public LessonAttemptsDTO updateStudent(Long lessonAttemptsId, Student newStudent) {
        Optional<LessonAttempts> laOpt = lessonAttemptsRepository.findById(lessonAttemptsId);
        if (laOpt.isPresent()) {
            LessonAttempts la = laOpt.get();
            la.setStudent(newStudent);
            return convertToDTO(lessonAttemptsRepository.save(la));
        }
        return null;
    }

    // PATCH: Update lesson
    public LessonAttemptsDTO updateLesson(Long lessonAttemptsId, Challenge newLesson) {
        Optional<LessonAttempts> laOpt = lessonAttemptsRepository.findById(lessonAttemptsId);
        if (laOpt.isPresent()) {
            LessonAttempts la = laOpt.get();
            la.setLesson(newLesson);
            return convertToDTO(lessonAttemptsRepository.save(la));
        }
        return null;
    }

    public void deleteById(Long id) {
        lessonAttemptsRepository.deleteById(id);
    }

    public LessonAttemptsDTO convertToDTO(LessonAttempts lessonAttempts) {
        if (lessonAttempts == null) return null;
        return LessonAttemptsDTO.builder()
                .lessonAttemptsId(lessonAttempts.getLessonAttemptsId())
                .studentId(lessonAttempts.getStudent() != null ? lessonAttempts.getStudent().getStudentId() : null)
                .lessonId(lessonAttempts.getLesson() != null ? lessonAttempts.getLesson().getChallengeId() : null)
                .wpm(lessonAttempts.getWpm())
                .accuracy(lessonAttempts.getAccuracy())
                .completionTime(lessonAttempts.getCompletionTime())
                .attemptedAt(lessonAttempts.getAttemptedAt())
                .build();
    }

    public LessonAttempts convertFromDTO(LessonAttemptsDTO dto, Student student, Challenge lesson) {
        if (dto == null) return null;
        LessonAttempts la = new LessonAttempts();
        la.setLessonAttemptsId(dto.getLessonAttemptsId());
        la.setStudent(student);
        la.setLesson(lesson);
        la.setWpm(dto.getWpm());
        la.setAccuracy(dto.getAccuracy());
        la.setCompletionTime(dto.getCompletionTime());
        la.setAttemptedAt(dto.getAttemptedAt());
        return la;
    }
}
