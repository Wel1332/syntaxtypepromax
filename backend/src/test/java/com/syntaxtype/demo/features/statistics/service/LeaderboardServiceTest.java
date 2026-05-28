package com.syntaxtype.demo.features.statistics.service;

import com.syntaxtype.demo.features.statistics.dto.LeaderboardEntry;
import com.syntaxtype.demo.features.statistics.entity.Leaderboard;
import com.syntaxtype.demo.features.user.entity.User;
import com.syntaxtype.demo.core.enums.Category;
import com.syntaxtype.demo.features.statistics.repository.LeaderboardRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LeaderboardServiceTest {

    @Mock
    private LeaderboardRepository leaderboardRepository;

    @InjectMocks
    private LeaderboardService leaderboardService;

    private User testUser1;
    private User testUser2;
    private User testUser3;

    @BeforeEach
    void setUp() {
        testUser1 = new User();
        testUser1.setUserId(1L);
        testUser1.setUsername("player1");

        testUser2 = new User();
        testUser2.setUserId(2L);
        testUser2.setUsername("player2");

        testUser3 = new User();
        testUser3.setUserId(3L);
        testUser3.setUsername("player3");
    }

    private Leaderboard createLeaderboard(User user, Integer wpm, Integer accuracy, Category category) {
        Leaderboard lb = new Leaderboard();
        lb.setLeaderboardId(user.getUserId());
        lb.setUser(user);
        lb.setWordsPerMinute(wpm);
        lb.setAccuracy(accuracy);
        lb.setCategory(category);
        return lb;
    }

    @Nested
    @DisplayName("Combined Score Calculation Tests")
    class CombinedScoreCalculationTests {

        @Test
        @DisplayName("Should calculate combined score with 1.5x multiplier for accuracy > 95")
        void shouldCalculateCombinedScoreWithMultiplier() {
            // WPM: 100, Accuracy: 98 -> base = 100 * 0.98 = 98, with 1.5x = 147.0
            Double score = LeaderboardEntry.calculateCombinedScore(100, 98);
            assertThat(score).isEqualTo(147.0);
        }

        @Test
        @DisplayName("Should calculate combined score without multiplier for accuracy <= 95")
        void shouldCalculateCombinedScoreWithoutMultiplier() {
            // WPM: 100, Accuracy: 90 -> base = 100 * 0.90 = 90.0 (no multiplier)
            Double score = LeaderboardEntry.calculateCombinedScore(100, 90);
            assertThat(score).isEqualTo(90.0);
        }

        @Test
        @DisplayName("Should return 0 for null WPM")
        void shouldReturnZeroForNullWpm() {
            Double score = LeaderboardEntry.calculateCombinedScore(null, 90);
            assertThat(score).isEqualTo(0.0);
        }

        @Test
        @DisplayName("Should return 0 for null accuracy")
        void shouldReturnZeroForNullAccuracy() {
            Double score = LeaderboardEntry.calculateCombinedScore(100, null);
            assertThat(score).isEqualTo(0.0);
        }

        @Test
        @DisplayName("Should handle edge case accuracy exactly 95 (no multiplier)")
        void shouldNotApplyMultiplierAtExactly95() {
            // WPM: 100, Accuracy: 95 -> base = 100 * 0.95 = 95.0 (no multiplier)
            Double score = LeaderboardEntry.calculateCombinedScore(100, 95);
            assertThat(score).isEqualTo(95.0);
        }

        @Test
        @DisplayName("Should handle edge case accuracy 96 (with multiplier)")
        void shouldApplyMultiplierAt96() {
            // WPM: 100, Accuracy: 96 -> base = 100 * 0.96 = 96, with 1.5x = 144.0
            Double score = LeaderboardEntry.calculateCombinedScore(100, 96);
            assertThat(score).isEqualTo(144.0);
        }
    }

    @Nested
    @DisplayName("Ranking with Ties Tests")
    class RankingWithTiesTests {

        @Test
        @DisplayName("Should assign sequential ranks when no ties exist")
        void shouldAssignSequentialRanksWithoutTies() {
            List<Leaderboard> entries = Arrays.asList(
                    createLeaderboard(testUser1, 100, 95, Category.TYPING_TESTS),
                    createLeaderboard(testUser2, 90, 95, Category.TYPING_TESTS),
                    createLeaderboard(testUser3, 80, 95, Category.TYPING_TESTS)
            );

            when(leaderboardRepository.findTop10ByCategoryOrderByWordsPerMinuteDesc(Category.TYPING_TESTS))
                    .thenReturn(entries);

            List<LeaderboardEntry> result = leaderboardService.getTop10ByWpm(Category.TYPING_TESTS);

            assertThat(result).hasSize(3);
            assertThat(result.get(0).getRank()).isEqualTo(1);
            assertThat(result.get(1).getRank()).isEqualTo(2);
            assertThat(result.get(2).getRank()).isEqualTo(3);
        }

        @Test
        @DisplayName("Should assign same rank to tied entries")
        void shouldAssignSameRankToTiedEntries() {
            // Two users with same WPM (tie)
            List<Leaderboard> entries = Arrays.asList(
                    createLeaderboard(testUser1, 100, 95, Category.TYPING_TESTS),
                    createLeaderboard(testUser2, 100, 90, Category.TYPING_TESTS), // Same WPM
                    createLeaderboard(testUser3, 80, 95, Category.TYPING_TESTS)
            );

            when(leaderboardRepository.findTop10ByCategoryOrderByWordsPerMinuteDesc(Category.TYPING_TESTS))
                    .thenReturn(entries);

            List<LeaderboardEntry> result = leaderboardService.getTop10ByWpm(Category.TYPING_TESTS);

            assertThat(result).hasSize(3);
            assertThat(result.get(0).getRank()).isEqualTo(1);
            assertThat(result.get(1).getRank()).isEqualTo(1); // Same rank as tied entry
            assertThat(result.get(2).getRank()).isEqualTo(3); // Sequential, not rank 4
        }

        @Test
        @DisplayName("Should handle multiple ties at different positions")
        void shouldHandleMultipleTiesAtDifferentPositions() {
            List<Leaderboard> entries = Arrays.asList(
                    createLeaderboard(testUser1, 100, 95, Category.TYPING_TESTS),
                    createLeaderboard(testUser2, 100, 90, Category.TYPING_TESTS), // Tie at rank 1
                    createLeaderboard(testUser3, 90, 95, Category.TYPING_TESTS)
            );

            when(leaderboardRepository.findTop10ByCategoryOrderByAccuracyDesc(Category.TYPING_TESTS))
                    .thenReturn(entries);

            List<LeaderboardEntry> result = leaderboardService.getTop10ByAccuracy(Category.TYPING_TESTS);

            assertThat(result).hasSize(3);
            // Sorted by accuracy: user1 (95), user3 (90), user2 (90)
            assertThat(result.get(0).getUsername()).isEqualTo("player1");
            assertThat(result.get(0).getRank()).isEqualTo(1);
            assertThat(result.get(1).getUsername()).isEqualTo("player3");
            assertThat(result.get(1).getRank()).isEqualTo(2);
            assertThat(result.get(2).getUsername()).isEqualTo("player2");
            assertThat(result.get(2).getRank()).isEqualTo(2); // Tie with previous
        }
    }

    @Nested
    @DisplayName("Empty Results Handling Tests")
    class EmptyResultsHandlingTests {

        @Test
        @DisplayName("Should return empty list when no entries exist for category")
        void shouldReturnEmptyListWhenNoEntriesExist() {
            when(leaderboardRepository.findTop10ByCategoryOrderByWordsPerMinuteDesc(Category.CHALLENGES))
                    .thenReturn(Collections.emptyList());

            List<LeaderboardEntry> result = leaderboardService.getTop10ByWpm(Category.CHALLENGES);

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Should return empty list for empty accuracy results")
        void shouldReturnEmptyListForEmptyAccuracyResults() {
            when(leaderboardRepository.findTop10ByCategoryOrderByAccuracyDesc(Category.GALAXY))
                    .thenReturn(Collections.emptyList());

            List<LeaderboardEntry> result = leaderboardService.getTop10ByAccuracy(Category.GALAXY);

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Should return empty list for empty combined score results")
        void shouldReturnEmptyListForEmptyCombinedScoreResults() {
            when(leaderboardRepository.findByCategoryOrderByWordsPerMinuteDesc(Category.CROSSWORD))
                    .thenReturn(Collections.emptyList());

            List<LeaderboardEntry> result = leaderboardService.getTop10ByCombinedScore(Category.CROSSWORD);

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("Top 10 by WPM Tests")
    class Top10ByWpmTests {

        @Test
        @DisplayName("Should return entries sorted by WPM descending")
        void shouldReturnEntriesSortedByWpmDescending() {
            List<Leaderboard> entries = Arrays.asList(
                    createLeaderboard(testUser1, 120, 95, Category.TYPING_TESTS),
                    createLeaderboard(testUser2, 100, 98, Category.TYPING_TESTS),
                    createLeaderboard(testUser3, 80, 92, Category.TYPING_TESTS)
            );

            when(leaderboardRepository.findTop10ByCategoryOrderByWordsPerMinuteDesc(Category.TYPING_TESTS))
                    .thenReturn(entries);

            List<LeaderboardEntry> result = leaderboardService.getTop10ByWpm(Category.TYPING_TESTS);

            assertThat(result).hasSize(3);
            assertThat(result.get(0).getUsername()).isEqualTo("player1");
            assertThat(result.get(0).getWpm()).isEqualTo(120);
            assertThat(result.get(1).getUsername()).isEqualTo("player2");
            assertThat(result.get(1).getWpm()).isEqualTo(100);
            assertThat(result.get(2).getUsername()).isEqualTo("player3");
            assertThat(result.get(2).getWpm()).isEqualTo(80);
        }
    }

    @Nested
    @DisplayName("Top 10 by Accuracy Tests")
    class Top10ByAccuracyTests {

        @Test
        @DisplayName("Should return entries sorted by accuracy descending")
        void shouldReturnEntriesSortedByAccuracyDescending() {
            List<Leaderboard> entries = Arrays.asList(
                    createLeaderboard(testUser1, 100, 98, Category.TYPING_TESTS),
                    createLeaderboard(testUser2, 120, 95, Category.TYPING_TESTS),
                    createLeaderboard(testUser3, 80, 92, Category.TYPING_TESTS)
            );

            when(leaderboardRepository.findTop10ByCategoryOrderByAccuracyDesc(Category.TYPING_TESTS))
                    .thenReturn(entries);

            List<LeaderboardEntry> result = leaderboardService.getTop10ByAccuracy(Category.TYPING_TESTS);

            assertThat(result).hasSize(3);
            assertThat(result.get(0).getUsername()).isEqualTo("player1");
            assertThat(result.get(0).getAccuracy()).isEqualTo(98);
            assertThat(result.get(1).getUsername()).isEqualTo("player2");
            assertThat(result.get(1).getAccuracy()).isEqualTo(95);
            assertThat(result.get(2).getUsername()).isEqualTo("player3");
            assertThat(result.get(2).getAccuracy()).isEqualTo(92);
        }
    }

    @Nested
    @DisplayName("Top 10 by Combined Score Tests")
    class Top10ByCombinedScoreTests {

        @Test
        @DisplayName("Should sort by combined score and apply 1.5x multiplier correctly")
        void shouldSortByCombinedScoreWithMultiplier() {
            // User1: 100 WPM, 98% accuracy -> 100 * 0.98 * 1.5 = 147.0
            // User2: 120 WPM, 90% accuracy -> 120 * 0.90 = 108.0 (no multiplier, accuracy <= 95)
            List<Leaderboard> entries = Arrays.asList(
                    createLeaderboard(testUser1, 100, 98, Category.TYPING_TESTS),
                    createLeaderboard(testUser2, 120, 90, Category.TYPING_TESTS)
            );

            when(leaderboardRepository.findByCategoryOrderByWordsPerMinuteDesc(Category.TYPING_TESTS))
                    .thenReturn(entries);

            List<LeaderboardEntry> result = leaderboardService.getTop10ByCombinedScore(Category.TYPING_TESTS);

            assertThat(result).hasSize(2);
            // User1 should rank first due to 1.5x multiplier despite lower WPM
            assertThat(result.get(0).getUsername()).isEqualTo("player1");
            assertThat(result.get(0).getScore()).isEqualTo(147.0);
            assertThat(result.get(1).getUsername()).isEqualTo("player2");
            assertThat(result.get(1).getScore()).isEqualTo(108.0);
        }
    }

    @Nested
    @DisplayName("User Rankings Tests")
    class UserRankingsTests {

        @Test
        @DisplayName("Should return all rankings for a user across categories")
        void shouldReturnAllRankingsForUser() {
            List<Leaderboard> entries = Arrays.asList(
                    createLeaderboard(testUser1, 100, 95, Category.TYPING_TESTS),
                    createLeaderboard(testUser1, 90, 98, Category.CHALLENGES),
                    createLeaderboard(testUser1, 110, 92, Category.GALAXY)
            );

            when(leaderboardRepository.findAllByUserId(1L)).thenReturn(entries);

            List<LeaderboardEntry> result = leaderboardService.getUserRankings(1L);

            assertThat(result).hasSize(3);
        }

        @Test
        @DisplayName("Should return empty list for user with no entries")
        void shouldReturnEmptyListForUserWithNoEntries() {
            when(leaderboardRepository.findAllByUserId(999L)).thenReturn(Collections.emptyList());

            List<LeaderboardEntry> result = leaderboardService.getUserRankings(999L);

            assertThat(result).isEmpty();
        }
    }
}
