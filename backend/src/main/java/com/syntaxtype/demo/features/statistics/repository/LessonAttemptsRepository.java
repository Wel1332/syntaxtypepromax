package com.syntaxtype.demo.features.statistics.repository;

import com.syntaxtype.demo.features.statistics.entity.LessonAttempts;
import com.syntaxtype.demo.features.user.entity.Student;
import com.syntaxtype.demo.features.lesson.entity.Challenge;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface LessonAttemptsRepository extends JpaRepository<LessonAttempts, Long> {
    List<LessonAttempts> findByStudent(Student student);
    List<LessonAttempts> findByLesson(Challenge lesson);
    List<LessonAttempts> findByStudent_StudentIdAndLesson_ChallengeId(Long studentId, Long challengeId);
    List<LessonAttempts> findByWpm(Integer wpm);
    List<LessonAttempts> findByAccuracy(Integer accuracy);
    List<LessonAttempts> findByCompletionTime(Integer completionTime);
    List<LessonAttempts> findByAttemptedAt(LocalDateTime attemptedAt);
}