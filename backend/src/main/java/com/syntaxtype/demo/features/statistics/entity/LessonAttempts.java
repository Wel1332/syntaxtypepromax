package com.syntaxtype.demo.features.statistics.entity;

import java.time.LocalDateTime;

import com.syntaxtype.demo.features.lesson.entity.Challenge;
import com.syntaxtype.demo.features.user.entity.Student;

import jakarta.persistence.*;

import lombok.*;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "lesson_attempts")
@Builder
public class LessonAttempts {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long lessonAttemptsId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "challenge_id")
    private Challenge lesson;

    private Integer wpm;
    private Integer accuracy;
    private Integer completionTime;
    private LocalDateTime attemptedAt;
}
