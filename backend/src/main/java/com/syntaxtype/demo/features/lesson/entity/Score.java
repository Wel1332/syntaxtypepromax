package com.syntaxtype.demo.features.lesson.entity;

import com.syntaxtype.demo.features.user.entity.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "scores")
public class Score {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int score;
    private int timeInSeconds;

    private String challengeType;
    private double wpm;
    private LocalDateTime submittedAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    // No-args constructor
    public Score() {
    }

    // All-args constructor (excluding id because it's auto-generated)
    public Score(int score, int timeInSeconds, String challengeType, double wpm, LocalDateTime submittedAt) {
        this.score = score;
        this.timeInSeconds = timeInSeconds;
        this.challengeType = challengeType;
        this.wpm = wpm;
        this.submittedAt = submittedAt;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }

    public int getTimeInSeconds() {
        return timeInSeconds;
    }

    public void setTimeInSeconds(int timeInSeconds) {
        this.timeInSeconds = timeInSeconds;
    }

    public String getChallengeType() {
        return challengeType;
    }

    public void setChallengeType(String challengeType) {
        this.challengeType = challengeType;
    }

    public double getWpm() {
        return wpm;
    }

    public void setWpm(double wpm) {
        this.wpm = wpm;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    // toString (excluding submittedAt)
    @Override
    public String toString() {
        return "Score{" +
                "id=" + id +
                ", score=" + score +
                ", timeInSeconds=" + timeInSeconds +
                ", challengeType='" + challengeType + '\'' +
                ", wpm=" + wpm +
                '}';
    }
}
