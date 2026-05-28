package com.syntaxtype.demo.features.lesson.repository;

import com.syntaxtype.demo.features.lesson.entity.GalaxyChallenge;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GalaxyChallengeRepository extends JpaRepository<GalaxyChallenge, Long> {
    boolean existsByTitle(String title);
}
