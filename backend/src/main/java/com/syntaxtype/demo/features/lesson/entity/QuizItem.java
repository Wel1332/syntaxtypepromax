package com.syntaxtype.demo.features.lesson.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.syntaxtype.demo.features.lesson.entity.Quiz;
import jakarta.persistence.*;

@Entity
public class QuizItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String type; // reorder, typing, match
    private String question;

    @Column(columnDefinition = "TEXT")
    private String data; // Store JSON (e.g. parts, correctOrder, options, etc.)

    @Column(columnDefinition = "TEXT")
    private String hint;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id")
    @JsonBackReference
    private Quiz quiz;

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }

    public String getData() { return data; }
    public void setData(String data) { this.data = data; }

    public String getHint() { return hint; }
    public void setHint(String hint) { this.hint = hint; }

    public Quiz getQuiz() { return quiz; }
    public void setQuiz(Quiz quiz) { this.quiz = quiz; }
}