package com.syntaxtype.demo.features.statistics.repository;

import com.syntaxtype.demo.features.statistics.entity.Scoring;
import com.syntaxtype.demo.features.user.entity.User;
import com.syntaxtype.demo.core.enums.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface ScoringRepository extends JpaRepository<Scoring, Long> {
    Optional<Scoring> findByUser(User user);
    List<Scoring> findByTotalScore(Integer totalScore);
    List<Scoring> findByCorrectAnswers(Integer correctAnswers);
    List<Scoring> findByWrongAnswers(Integer wrongAnswers);
    List<Scoring> findByTotalTimeSpent(Integer totalTimeSpent);
    List<Scoring> findByAverageTimeSpentBetweenWords(Double averageTimeSpentBetweenWords);
    List<Scoring> findByAnsweredWords(List<String> answeredWords);
    List<Scoring> findByWrongWords(List<String> wrongWords);
    List<Scoring> findByCategory(Category category);
}