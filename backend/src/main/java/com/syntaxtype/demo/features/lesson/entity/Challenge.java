package com.syntaxtype.demo.features.lesson.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.util.*;

import lombok.*;

import com.syntaxtype.demo.core.enums.ChallengeType;
@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "challenges")
public class Challenge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long challengeId;


    @Enumerated(EnumType.STRING)
    private ChallengeType type;

    // @Lob
    @Column(columnDefinition = "TEXT")
    private String paragraph;

    @ElementCollection
    @CollectionTable(name = "challenge_words", joinColumns = @JoinColumn(name = "challenge_id"))
    @Column(name = "word")
    private List<String> words = new ArrayList<>();// ✅ initialized directly

    @Column(name = "test_timer")
    private Integer testTimer;

    @Column(name = "speed")
    private Integer speed;

    @Column(name = "max_lives")
    private Integer maxLives;
    @Column(name = "use_lives")
    private Boolean useLives;
    @ElementCollection
    @CollectionTable(name = "challenge_wrong_words", joinColumns = @JoinColumn(name = "challenge_id")) // ✅ ADDED THIS
    @Column(name = "wrong_word")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private List<String> wrongWords = new ArrayList<>();
}