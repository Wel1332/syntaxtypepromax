package com.syntaxtype.demo.features.lesson.entity.galaxy;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "galaxy_challenge_question")
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "question_text", nullable = false)
    private String question;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", nullable = false)
    private QuestionTypes type;

    @ElementCollection
    @CollectionTable(
            name = "galaxy_challenge_question_choices",
            joinColumns = @JoinColumn(name = "question_id")
    )
    private List<Choice> choices = new ArrayList<>();
}