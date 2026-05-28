package com.syntaxtype.demo.features.statistics.entity;

import com.syntaxtype.demo.core.enums.Category;
import com.syntaxtype.demo.features.user.entity.User;

import jakarta.persistence.*;

import java.util.List;

import lombok.*;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "scoring")
@Builder
public class Scoring {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long scoringId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    private Integer totalScore; // total score of challenge
    private Integer correctAnswers; // number of correct answers
    private Integer wrongAnswers; // number of wrong answers
    private Integer totalTimeSpent; // total time spent in the challenge
    private Double averageTimeSpentBetweenWords; // average time spent in between answering words (applies only to crossword i guess?)
    private List<String> answeredWords; // list of answered words in the challenge
    private List<String> wrongWords; // list of answered but wrong words in the challenge

    @Enumerated(EnumType.STRING)
    @Column(name = "category")
    private Category category;
}