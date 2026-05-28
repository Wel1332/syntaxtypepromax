package com.syntaxtype.demo.features.statistics.repository;

import com.syntaxtype.demo.features.statistics.entity.UserStatistics;
import com.syntaxtype.demo.features.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface UserStatisticsRepository extends JpaRepository<UserStatistics, Long> {
    Optional<UserStatistics> findByUser(User user);
    List<UserStatistics> findByWordsPerMinute(Integer wordsPerMinute);
    List<UserStatistics> findByAccuracy(Integer accuracy);
    List<UserStatistics> findByTotalWordsTyped(Integer totalWordsTyped);
    List<UserStatistics> findByTotalTimeSpent(Integer totalTimeSpent);
    List<UserStatistics> findByTotalErrors(Integer totalErrors);
    List<UserStatistics> findByTotalTestsTaken(Integer totalTestsTaken);
    List<UserStatistics> findByFastestClearTime(Integer fastestClearTime);
}
