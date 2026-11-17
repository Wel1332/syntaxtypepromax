package com.syntaxtype.demo.features.classroom.dto;

import java.time.Instant;
import java.util.List;

/**
 * Everyone's results on one challenge, for the teacher who owns the class: every
 * student in the class now, plus anyone who played before leaving it, each with
 * all of their attempts, newest first. Times are instants, so the browser shows
 * them in the teacher's own time zone.
 */
public record ClassChallengeResultsDTO(ClassChallengeDTO challenge, List<StudentResults> students) {

    public record StudentResults(Long studentId, String name, String username, boolean enrolled,
                                 List<Attempt> attempts) {
    }

    public record Attempt(int score, int correctCount, int totalCount, int accuracy,
                          int durationSeconds, Instant submittedAt) {
    }
}
