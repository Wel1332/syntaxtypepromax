package com.syntaxtype.demo.features.classroom.entity;

import com.syntaxtype.demo.core.enums.ContentGame;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * A set of questions a teacher made for one class, played in one of the study
 * games. Kept in its own table rather than in game_content so it can never mix
 * into the Pre-Test, Practice or Post-Test banks the study measures with.
 */
@Entity
@Table(name = "class_challenges",
        indexes = @Index(name = "idx_class_challenge_classroom", columnList = "classroom_id"))
@Getter
@Setter
@NoArgsConstructor
public class ClassChallenge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long challengeId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "classroom_id", nullable = false)
    private Classroom classroom;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ContentGame game;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(length = 1000)
    private String instructions;

    // A JSON array, validated per game by ClassChallengeItems before it is stored.
    @Column(name = "items", columnDefinition = "TEXT", nullable = false)
    private String itemsJson;

    @Column(nullable = false)
    private int itemCount;

    // Null means unlimited.
    private Integer maxAttempts;

    // Hidden until the teacher shows it, so a half-written challenge never reaches students.
    @Column(nullable = false)
    private boolean visible;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
