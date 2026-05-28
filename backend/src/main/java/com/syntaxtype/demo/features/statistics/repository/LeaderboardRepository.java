package com.syntaxtype.demo.features.statistics.repository;

import com.syntaxtype.demo.features.statistics.entity.Leaderboard;
import com.syntaxtype.demo.features.user.entity.User;
import com.syntaxtype.demo.core.enums.Category;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.List;

public interface LeaderboardRepository extends JpaRepository<Leaderboard, Long> {
    Optional<Leaderboard> findByUser(User user);
    Optional<Leaderboard> findByUserAndCategory(User user, Category category);
    List<Leaderboard> findByWordsPerMinute(Integer wordsPerMinute);
    List<Leaderboard> findByAccuracy(Integer accuracy);
    List<Leaderboard> findByTotalWordsTyped(Integer totalWordsTyped);
    List<Leaderboard> findByTotalTimeSpent(Integer totalTimeSpent);
    List<Leaderboard> findByCategory(Category category);

    /**
     * Retrieves top 10 leaderboard entries for a category ordered by WPM descending.
     * Joins user data for efficient fetching.
     *
     * @param category The game category
     * @return List of top 10 Leaderboard entries by WPM
     */
    @Query("SELECT l FROM Leaderboard l JOIN FETCH l.user WHERE l.category = :category ORDER BY l.wordsPerMinute DESC")
    List<Leaderboard> findTop10ByCategoryOrderByWordsPerMinuteDesc(@Param("category") Category category);

    /**
     * Retrieves top 10 leaderboard entries for a category ordered by accuracy descending.
     * Joins user data for efficient fetching.
     *
     * @param category The game category
     * @return List of top 10 Leaderboard entries by accuracy
     */
    @Query("SELECT l FROM Leaderboard l JOIN FETCH l.user WHERE l.category = :category ORDER BY l.accuracy DESC")
    List<Leaderboard> findTop10ByCategoryOrderByAccuracyDesc(@Param("category") Category category);

    /**
     * Retrieves all leaderboard entries for a category ordered by WPM descending.
     * Used for combined score calculation.
     *
     * @param category The game category
     * @return List of all Leaderboard entries by WPM for the category
     */
    List<Leaderboard> findByCategoryOrderByWordsPerMinuteDesc(Category category);

    /**
     * Retrieves all leaderboard entries for a category ordered by accuracy descending.
     * Used for combined score calculation.
     *
     * @param category The game category
     * @return List of all Leaderboard entries by accuracy for the category
     */
    List<Leaderboard> findByCategoryOrderByAccuracyDesc(Category category);

    /**
     * Retrieves top entries for all categories for a specific user.
     * Used for global leaderboard and user rankings.
     *
     * @param userId The user ID
     * @return List of leaderboard entries for the user across all categories
     */
    @Query("SELECT l FROM Leaderboard l JOIN FETCH l.user WHERE l.user.userId = :userId")
    List<Leaderboard> findAllByUserId(@Param("userId") Long userId);

    /**
     * Retrieves top entries across all categories ordered by WPM descending.
     * Used for global leaderboard.
     *
     * @return List of top leaderboard entries by WPM across all categories
     */
    @Query("SELECT l FROM Leaderboard l JOIN FETCH l.user ORDER BY l.wordsPerMinute DESC")
    List<Leaderboard> findTopByWordsPerMinute();

    /**
     * Retrieves top N leaderboard entries for a category ordered by WPM descending.
     * Optimized for rank calculation in typing games.
     *
     * @param category The game category
     * @param pageable Pageable with limit
     * @return List of top N Leaderboard entries by WPM for the category
     */
    @Query("SELECT l FROM Leaderboard l JOIN FETCH l.user WHERE l.category = :category ORDER BY l.wordsPerMinute DESC")
    List<Leaderboard> findTopNByCategoryOrderByWpmDesc(@Param("category") Category category, Pageable pageable);

    /**
     * Retrieves top N leaderboard entries for a category ordered by score descending.
     * Optimized for rank calculation in non-typing games.
     *
     * @param category The game category
     * @param pageable Pageable with limit
     * @return List of top N Leaderboard entries by score for the category
     */
    @Query("SELECT l FROM Leaderboard l JOIN FETCH l.user WHERE l.category = :category ORDER BY l.score DESC")
    List<Leaderboard> findTopNByCategoryOrderByScoreDesc(@Param("category") Category category, Pageable pageable);

    /**
     * Retrieves top N leaderboard entries for a category ordered by combined score descending.
     * Combined score = wpm * (accuracy / 100.0) with 1.5x multiplier if accuracy > 95.
     * Uses native query for database-level sorting to ensure accurate ranking.
     *
     * @param category The game category (as string)
     * @param pageable Pageable with limit
     * @return List of top N Leaderboard entries ordered by combined score
     */
    @Query(value = "SELECT l.* FROM leaderboards l " +
           "WHERE l.category = :category " +
           "ORDER BY (CASE WHEN l.accuracy > 95 THEN l.words_per_minute * (l.accuracy / 100.0) * 1.5 " +
           "ELSE l.words_per_minute * (l.accuracy / 100.0) END) DESC",
           nativeQuery = true)
    List<Leaderboard> findTopNByCategoryOrderByCombinedScoreDesc(
            @Param("category") String category,
            Pageable pageable);
}
