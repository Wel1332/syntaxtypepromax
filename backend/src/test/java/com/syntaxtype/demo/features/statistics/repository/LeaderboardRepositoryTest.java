package com.syntaxtype.demo.features.statistics.repository;

import com.syntaxtype.demo.core.enums.Category;
import com.syntaxtype.demo.features.statistics.entity.Leaderboard;
import com.syntaxtype.demo.features.user.entity.User;
import com.syntaxtype.demo.core.enums.Role;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
@DisplayName("LeaderboardRepository Tests")
class LeaderboardRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private LeaderboardRepository leaderboardRepository;

    private User createAndPersistUser(String username, String email) {
        User user = User.builder()
                .username(username)
                .email(email)
                .password("password123")
                .userRole(Role.USER)
                .createdAt(LocalDateTime.now())
                .build();
        return entityManager.persistFlushFind(user);
    }

    private Leaderboard createAndPersistLeaderboard(User user, Category category, int wpm, int accuracy) {
        Leaderboard leaderboard = Leaderboard.builder()
                .user(user)
                .category(category)
                .wordsPerMinute(wpm)
                .accuracy(accuracy)
                .totalWordsTyped(500)
                .totalTimeSpent(3600)
                .build();
        return entityManager.persistFlushFind(leaderboard);
    }

    @Test
    @DisplayName("Should find top 10 by WPM for a category")
    void shouldFindTop10ByWpmForCategory() {
        User user1 = createAndPersistUser("user1", "user1@test.com");
        User user2 = createAndPersistUser("user2", "user2@test.com");
        User user3 = createAndPersistUser("user3", "user3@test.com");

        // Lower WPM first
        createAndPersistLeaderboard(user1, Category.TYPING_TESTS, 50, 80);
        // Higher WPM second
        createAndPersistLeaderboard(user2, Category.TYPING_TESTS, 100, 75);
        // Highest WPM last
        createAndPersistLeaderboard(user3, Category.TYPING_TESTS, 120, 85);

        List<Leaderboard> results = leaderboardRepository
                .findTop10ByCategoryOrderByWordsPerMinuteDesc(Category.TYPING_TESTS);

        assertEquals(3, results.size());
        // Verify order by WPM descending
        assertEquals(120, results.get(0).getWordsPerMinute());
        assertEquals(100, results.get(1).getWordsPerMinute());
        assertEquals(50, results.get(2).getWordsPerMinute());
    }

    @Test
    @DisplayName("Should find top 10 by accuracy for a category")
    void shouldFindTop10ByAccuracyForCategory() {
        User user1 = createAndPersistUser("userA", "userA@test.com");
        User user2 = createAndPersistUser("userB", "userB@test.com");
        User user3 = createAndPersistUser("userC", "userC@test.com");

        // Lower accuracy first
        createAndPersistLeaderboard(user1, Category.CHALLENGES, 80, 70);
        // Higher accuracy second
        createAndPersistLeaderboard(user2, Category.CHALLENGES, 85, 90);
        // Highest accuracy last
        createAndPersistLeaderboard(user3, Category.CHALLENGES, 75, 98);

        List<Leaderboard> results = leaderboardRepository
                .findTop10ByCategoryOrderByAccuracyDesc(Category.CHALLENGES);

        assertEquals(3, results.size());
        // Verify order by accuracy descending
        assertEquals(98, results.get(0).getAccuracy());
        assertEquals(90, results.get(1).getAccuracy());
        assertEquals(70, results.get(2).getAccuracy());
    }

    @Test
    @DisplayName("Should only return entries for specified category")
    void shouldOnlyReturnEntriesForSpecifiedCategory() {
        User user1 = createAndPersistUser("userX", "userX@test.com");
        User user2 = createAndPersistUser("userY", "userY@test.com");

        createAndPersistLeaderboard(user1, Category.TYPING_TESTS, 100, 85);
        createAndPersistLeaderboard(user2, Category.GALAXY, 90, 80);

        List<Leaderboard> typingResults = leaderboardRepository
                .findTop10ByCategoryOrderByWordsPerMinuteDesc(Category.TYPING_TESTS);

        List<Leaderboard> galaxyResults = leaderboardRepository
                .findTop10ByCategoryOrderByWordsPerMinuteDesc(Category.GALAXY);

        assertEquals(1, typingResults.size());
        assertEquals(Category.TYPING_TESTS, typingResults.get(0).getCategory());

        assertEquals(1, galaxyResults.size());
        assertEquals(Category.GALAXY, galaxyResults.get(0).getCategory());
    }

    @Test
    @DisplayName("Should return empty list for category with no entries")
    void shouldReturnEmptyListForCategoryWithNoEntries() {
        List<Leaderboard> results = leaderboardRepository
                .findTop10ByCategoryOrderByWordsPerMinuteDesc(Category.OVERALL);

        assertTrue(results.isEmpty());
    }

    @Test
    @DisplayName("Should fetch user data with JOIN FETCH")
    void shouldFetchUserDataWithJoinFetch() {
        User user = createAndPersistUser("fetchuser", "fetchuser@test.com");
        createAndPersistLeaderboard(user, Category.FALLING_WORDS, 95, 92);

        List<Leaderboard> results = leaderboardRepository
                .findTop10ByCategoryOrderByWordsPerMinuteDesc(Category.FALLING_WORDS);

        assertEquals(1, results.size());
        // Verify user is fetched (no lazy loading exception)
        assertNotNull(results.get(0).getUser());
        assertEquals("fetchuser", results.get(0).getUser().getUsername());
    }

    @Test
    @DisplayName("Should handle mixed categories correctly")
    void shouldHandleMixedCategoriesCorrectly() {
        User user1 = createAndPersistUser("userP", "userP@test.com");
        User user2 = createAndPersistUser("userQ", "userQ@test.com");
        User user3 = createAndPersistUser("userR", "userR@test.com");

        createAndPersistLeaderboard(user1, Category.CROSSWORD, 60, 95);
        createAndPersistLeaderboard(user2, Category.TYPING_TESTS, 80, 85);
        createAndPersistLeaderboard(user3, Category.CROSSWORD, 70, 88);

        List<Leaderboard> crosswordResults = leaderboardRepository
                .findTop10ByCategoryOrderByWordsPerMinuteDesc(Category.CROSSWORD);

        List<Leaderboard> typingResults = leaderboardRepository
                .findTop10ByCategoryOrderByWordsPerMinuteDesc(Category.TYPING_TESTS);

        assertEquals(2, crosswordResults.size());
        assertEquals(1, typingResults.size());
    }

    @Test
    @DisplayName("Should work with all category enum values")
    void shouldWorkWithAllCategoryValues() {
        User user = createAndPersistUser("allcat", "allcat@test.com");

        for (Category category : Category.values()) {
            createAndPersistLeaderboard(user, category, 50, 80);
        }

        for (Category category : Category.values()) {
            List<Leaderboard> results = leaderboardRepository
                    .findTop10ByCategoryOrderByWordsPerMinuteDesc(category);
            
            assertFalse(results.isEmpty(),
                    "Should have results for category: " + category);
            assertEquals(category, results.get(0).getCategory());
        }
    }

    /**
     * These cover findBestPerUserByMetric, which is native SQL and therefore not
     * checked by the compiler at all. The service tests above it mock the
     * repository, so without these the query's first execution would be against
     * the live database on the endpoint that serves the public landing page.
     */
    @Test
    @DisplayName("Should return one row per user, the user's best for the metric")
    void shouldReturnBestEntryPerUser() {
        User fast = createAndPersistUser("fast", "fast@test.com");
        User slow = createAndPersistUser("slow", "slow@test.com");

        // Two categories each, so the per-user reduction has something to collapse.
        createAndPersistLeaderboard(fast, Category.TYPING_TESTS, 120, 90);
        createAndPersistLeaderboard(fast, Category.CHALLENGES, 60, 70);
        createAndPersistLeaderboard(slow, Category.TYPING_TESTS, 40, 99);
        createAndPersistLeaderboard(slow, Category.CHALLENGES, 30, 60);

        List<Leaderboard> byWpm =
                leaderboardRepository.findBestPerUserByMetric("wpm", PageRequest.of(0, 10));

        assertEquals(2, byWpm.size(), "one row per user, not one per user-category");
        assertEquals(120, byWpm.get(0).getWordsPerMinute(), "best first");
        assertEquals(40, byWpm.get(1).getWordsPerMinute());

        // Accuracy ranks the same two users the other way round, which proves the
        // metric argument actually reaches the ORDER BY rather than being ignored.
        List<Leaderboard> byAccuracy =
                leaderboardRepository.findBestPerUserByMetric("accuracy", PageRequest.of(0, 10));

        assertEquals(2, byAccuracy.size());
        assertEquals(99, byAccuracy.get(0).getAccuracy());
        assertEquals(90, byAccuracy.get(1).getAccuracy());
    }

    @Test
    @DisplayName("Should apply the row limit and rank combined score above raw WPM")
    void shouldLimitAndRankByCombinedScore() {
        // 100 wpm at 96% clears the >95 bonus: 100 * 0.96 * 1.5 = 144.
        // 130 wpm at 80% does not: 130 * 0.80 = 104. So the slower typist wins.
        User accurate = createAndPersistUser("accurate", "accurate@test.com");
        User reckless = createAndPersistUser("reckless", "reckless@test.com");
        createAndPersistLeaderboard(accurate, Category.TYPING_TESTS, 100, 96);
        createAndPersistLeaderboard(reckless, Category.TYPING_TESTS, 130, 80);

        List<Leaderboard> combined =
                leaderboardRepository.findBestPerUserByMetric("combined", PageRequest.of(0, 10));

        assertEquals(2, combined.size());
        assertEquals("accurate", combined.get(0).getUser().getUsername(),
                "the accuracy bonus should outrank raw speed");

        List<Leaderboard> limited =
                leaderboardRepository.findBestPerUserByMetric("combined", PageRequest.of(0, 1));
        assertEquals(1, limited.size(), "the pageable limit must reach the SQL");
    }

    @Test
    @DisplayName("Should return an empty list when there are no entries")
    void shouldReturnEmptyWhenNoEntries() {
        assertTrue(leaderboardRepository.findBestPerUserByMetric("combined", PageRequest.of(0, 10)).isEmpty());
    }
}
