package com.syntaxtype.demo.features.statistics.dto;

import com.syntaxtype.demo.core.enums.Category;

import java.util.List;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoringDTO {
    private Long scoringId;
    private Long userId;
    private Integer totalScore; // total score of challenge
    private Integer correctAnswers; // number of correct answers
    private Integer wrongAnswers; // number of wrong answers
    private Integer totalTimeSpent; // total time spent in the challenge
    private Double averageTimeSpentBetweenWords; // average time spent in between answering words (applies only to crossword i guess?)
    private List<String> answeredWords; // list of answered words in the challenge
    private List<String> wrongWords; // list of answered but wrong words in the challenge
    private Category category;
}
