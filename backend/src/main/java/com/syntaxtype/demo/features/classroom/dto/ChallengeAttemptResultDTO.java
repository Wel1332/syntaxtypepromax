package com.syntaxtype.demo.features.classroom.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

// attemptsRemaining is left out when the challenge has no limit.
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ChallengeAttemptResultDTO(long attemptsUsed, Long attemptsRemaining) {
}
