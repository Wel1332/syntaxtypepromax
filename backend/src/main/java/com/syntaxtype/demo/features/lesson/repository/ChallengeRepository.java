package com.syntaxtype.demo.features.lesson.repository;


import com.syntaxtype.demo.core.enums.ChallengeType;
import com.syntaxtype.demo.features.lesson.entity.Challenge;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChallengeRepository extends JpaRepository<Challenge, Long> {
    List<Challenge> findByType(ChallengeType type); // Custom query method
    Optional<Challenge> findBychallengeIdAndType(Long challengeId, ChallengeType type);
}