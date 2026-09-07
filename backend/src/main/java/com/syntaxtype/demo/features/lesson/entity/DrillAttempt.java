package com.syntaxtype.demo.features.lesson.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

/**
 * One drill within one session (Objective 2.3).
 *
 * A {@link Score} row records a whole session as a single aggregate — cleared,
 * presented, misses. That is enough to say a student got 4 of 6, but not *which*
 * 4, how long each took, or which topics the misses clustered in, so the error
 * distribution the objective asks for could not be reconstructed after the fact.
 * This table stores the per-drill detail that aggregate throws away.
 *
 * The rows hang off the parent Score rather than off the user directly, so
 * student, game, mode (PRE_TEST / POST_TEST) and submission time all come from
 * the session and cannot drift out of agreement with it.
 *
 * Writing this table is optional: a client that sends no drill list still gets
 * its Score saved exactly as before. That keeps older frontends — and the two
 * game modes not yet sending detail — working unchanged.
 */
@Entity
@Table(name = "drill_attempts", indexes = {
        @Index(name = "idx_drill_attempts_score", columnList = "score_id")
})
public class DrillAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "score_id", nullable = false)
    @JsonIgnore
    private Score score;

    /** 1-based position in the session as presented. Order is shuffled per session. */
    private int position;

    /** Drill identifier from the bank, e.g. "P-01". Null if the bank has no stable ids. */
    private String itemId;

    /** Syntax area or construct the drill exercises, when the bank tags one. */
    private String topic;

    /** easy / medium / hard, as tagged in the bank. */
    private String difficulty;

    /**
     * Error category for a missed drill, using the same vocabulary as the Bug
     * Smasher banks (missing-terminator, mismatched-delimiter, incorrect-keyword,
     * malformed-declaration, wrong-operator). Null when the drill was cleared or
     * the game does not classify its errors.
     */
    private String errorCategory;

    /** Whether the student completed the drill before the per-drill timer expired. */
    private boolean cleared;

    /** Milliseconds spent on this drill. This is the completion time in 2.3. */
    private int timeMs;

    /** Wrong keystrokes or wrong answers on this drill. */
    private int misses;

    public DrillAttempt() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Score getScore() {
        return score;
    }

    public void setScore(Score score) {
        this.score = score;
    }

    public int getPosition() {
        return position;
    }

    public void setPosition(int position) {
        this.position = position;
    }

    public String getItemId() {
        return itemId;
    }

    public void setItemId(String itemId) {
        this.itemId = itemId;
    }

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(String difficulty) {
        this.difficulty = difficulty;
    }

    public String getErrorCategory() {
        return errorCategory;
    }

    public void setErrorCategory(String errorCategory) {
        this.errorCategory = errorCategory;
    }

    public boolean isCleared() {
        return cleared;
    }

    public void setCleared(boolean cleared) {
        this.cleared = cleared;
    }

    public int getTimeMs() {
        return timeMs;
    }

    public void setTimeMs(int timeMs) {
        this.timeMs = timeMs;
    }

    public int getMisses() {
        return misses;
    }

    public void setMisses(int misses) {
        this.misses = misses;
    }

    @Override
    public String toString() {
        return "DrillAttempt{" +
                "id=" + id +
                ", position=" + position +
                ", itemId='" + itemId + '\'' +
                ", cleared=" + cleared +
                ", timeMs=" + timeMs +
                '}';
    }
}
