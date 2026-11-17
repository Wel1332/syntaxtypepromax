package com.syntaxtype.demo.features.classroom.entity;

import com.syntaxtype.demo.features.user.entity.Student;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * One finished play of a class challenge. Its own table rather than scores, so
 * class results never reach the leaderboards, personal stats or the Pre/Post
 * analytics, all of which read scores.
 */
@Entity
@Table(name = "class_challenge_attempts",
        indexes = @Index(name = "idx_class_attempt_challenge_student", columnList = "challenge_id,student_id"))
@Getter
@Setter
@NoArgsConstructor
public class ClassChallengeAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long attemptId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "challenge_id", nullable = false)
    private ClassChallenge challenge;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    private int score;

    private int correctCount;

    private int totalCount;

    private int accuracy;

    private int durationSeconds;

    private LocalDateTime submittedAt;

    @PrePersist
    protected void onCreate() {
        submittedAt = LocalDateTime.now();
    }
}
