package com.syntaxtype.demo.features.statistics.dto;

import com.syntaxtype.demo.core.enums.Category;
import com.syntaxtype.demo.features.statistics.entity.Leaderboard;
import com.syntaxtype.demo.features.user.entity.User;
import com.syntaxtype.demo.core.enums.Role;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Nested;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class LeaderboardEntryTest {

    @Nested
    @DisplayName("calculateCombinedScore tests")
    class CalculateCombinedScoreTests {

        @Test
        @DisplayName("Should calculate basic combined score")
        void shouldCalculateBasicCombinedScore() {
            // WPM: 100, Accuracy: 80%
            // Base: 100 * (80 / 100.0) = 80.0
            Double score = LeaderboardEntry.calculateCombinedScore(100, 80);
            assertEquals(80.0, score);
        }

        @Test
        @DisplayName("Should apply 1.5 multiplier for accuracy > 95")
        void shouldApplyMultiplierForHighAccuracy() {
            // WPM: 100, Accuracy: 98%
            // Base: 100 * (98 / 100.0) = 98.0
            // With multiplier: 98.0 * 1.5 = 147.0
            Double score = LeaderboardEntry.calculateCombinedScore(100, 98);
            assertEquals(147.0, score);
        }

        @Test
        @DisplayName("Should NOT apply multiplier for accuracy = 95")
        void shouldNotApplyMultiplierForAccuracy95() {
            // WPM: 100, Accuracy: 95%
            // Base: 100 * (95 / 100.0) = 95.0
            // No multiplier (only > 95)
            Double score = LeaderboardEntry.calculateCombinedScore(100, 95);
            assertEquals(95.0, score);
        }

        @Test
        @DisplayName("Should apply multiplier for accuracy = 96")
        void shouldApplyMultiplierForAccuracy96() {
            // WPM: 100, Accuracy: 96%
            // Base: 100 * (96 / 100.0) = 96.0
            // With multiplier: 96.0 * 1.5 = 144.0
            Double score = LeaderboardEntry.calculateCombinedScore(100, 96);
            assertEquals(144.0, score);
        }

        @Test
        @DisplayName("Should round to 2 decimal places")
        void shouldRoundToTwoDecimalPlaces() {
            // WPM: 85, Accuracy: 87%
            // Base: 85 * (87 / 100.0) = 73.95
            Double score = LeaderboardEntry.calculateCombinedScore(85, 87);
            assertEquals(73.95, score);
        }

        @Test
        @DisplayName("Should round up correctly")
        void shouldRoundUpCorrectly() {
            // WPM: 77, Accuracy: 93%
            // Base: 77 * (93 / 100.0) = 71.61
            Double score = LeaderboardEntry.calculateCombinedScore(77, 93);
            assertEquals(71.61, score);
        }

        @Test
        @DisplayName("Should return 0.0 for null WPM")
        void shouldReturnZeroForNullWpm() {
            Double score = LeaderboardEntry.calculateCombinedScore(null, 80);
            assertEquals(0.0, score);
        }

        @Test
        @DisplayName("Should return 0.0 for null accuracy")
        void shouldReturnZeroForNullAccuracy() {
            Double score = LeaderboardEntry.calculateCombinedScore(100, null);
            assertEquals(0.0, score);
        }

        @Test
        @DisplayName("Should return 0.0 for both null values")
        void shouldReturnZeroForBothNull() {
            Double score = LeaderboardEntry.calculateCombinedScore(null, null);
            assertEquals(0.0, score);
        }
    }

    @Nested
    @DisplayName("fromLeaderboard factory method tests")
    class FromLeaderboardTests {

        private User createTestUser() {
            return User.builder()
                    .userId(1L)
                    .username("testuser")
                    .email("test@example.com")
                    .password("password")
                    .userRole(Role.USER)
                    .build();
        }

        private Leaderboard createTestLeaderboard(User user, Category category, int wpm, int accuracy) {
            return Leaderboard.builder()
                    .leaderboardId(1L)
                    .user(user)
                    .category(category)
                    .wordsPerMinute(wpm)
                    .accuracy(accuracy)
                    .totalWordsTyped(500)
                    .totalTimeSpent(3600)
                    .build();
        }

        @Test
        @DisplayName("Should create LeaderboardEntry with correct values")
        void shouldCreateLeaderboardEntryWithCorrectValues() {
            User user = createTestUser();
            Leaderboard lb = createTestLeaderboard(user, Category.TYPING_TESTS, 100, 80);
            LocalDateTime now = LocalDateTime.now();

            LeaderboardEntry entry = LeaderboardEntry.fromLeaderboard(lb, 1, now);

            assertEquals(1, entry.getRank());
            assertEquals("testuser", entry.getUsername());
            assertEquals(80.0, entry.getScore()); // 100 * 0.8 = 80
            assertEquals(100, entry.getWpm());
            assertEquals(80, entry.getAccuracy());
            assertEquals("TYPING_TESTS", entry.getGameName());
            assertEquals(now, entry.getDateAchieved());
        }

        @Test
        @DisplayName("Should apply multiplier for high accuracy in factory method")
        void shouldApplyMultiplierInFactoryMethod() {
            User user = createTestUser();
            Leaderboard lb = createTestLeaderboard(user, Category.CHALLENGES, 100, 98);
            LocalDateTime now = LocalDateTime.now();

            LeaderboardEntry entry = LeaderboardEntry.fromLeaderboard(lb, 2, now);

            // 100 * 0.98 * 1.5 = 147.0
            assertEquals(147.0, entry.getScore());
        }

        @Test
        @DisplayName("Should map category correctly to gameName")
        void shouldMapCategoryToGameName() {
            User user = createTestUser();
            Category[] categories = {
                Category.CHALLENGES,
                Category.TYPING_TESTS,
                Category.FALLING_WORDS,
                Category.CROSSWORD,
                Category.GALAXY,
                Category.OVERALL
            };

            LocalDateTime now = LocalDateTime.now();

            for (Category category : categories) {
                Leaderboard lb = createTestLeaderboard(user, category, 50, 90);
                LeaderboardEntry entry = LeaderboardEntry.fromLeaderboard(lb, 1, now);
                assertEquals(category.name(), entry.getGameName());
            }
        }
    }

    @Nested
    @DisplayName("Builder pattern tests")
    class BuilderTests {

        @Test
        @DisplayName("Should build LeaderboardEntry with all fields")
        void shouldBuildLeaderboardEntryWithAllFields() {
            LocalDateTime date = LocalDateTime.of(2024, 3, 15, 10, 30);
            
            LeaderboardEntry entry = LeaderboardEntry.builder()
                    .rank(5)
                    .username("builderuser")
                    .score(125.50)
                    .wpm(85)
                    .accuracy(96)
                    .gameName("CHALLENGES")
                    .dateAchieved(date)
                    .build();

            assertEquals(5, entry.getRank());
            assertEquals("builderuser", entry.getUsername());
            assertEquals(125.50, entry.getScore());
            assertEquals(85, entry.getWpm());
            assertEquals(96, entry.getAccuracy());
            assertEquals("CHALLENGES", entry.getGameName());
            assertEquals(date, entry.getDateAchieved());
        }

        @Test
        @DisplayName("Should allow partial builder construction")
        void shouldAllowPartialConstruction() {
            LeaderboardEntry entry = LeaderboardEntry.builder()
                    .rank(1)
                    .username("minimal")
                    .build();

            assertEquals(1, entry.getRank());
            assertEquals("minimal", entry.getUsername());
            assertNull(entry.getScore());
            assertNull(entry.getWpm());
            assertNull(entry.getAccuracy());
            assertNull(entry.getGameName());
            assertNull(entry.getDateAchieved());
        }
    }

    @Nested
    @DisplayName("NoArgsConstructor and AllArgsConstructor tests")
    class ConstructorTests {

        @Test
        @DisplayName("Should create instance with no-args constructor")
        void shouldCreateWithNoArgsConstructor() {
            LeaderboardEntry entry = new LeaderboardEntry();
            assertNotNull(entry);
        }

        @Test
        @DisplayName("Should create instance with all-args constructor")
        void shouldCreateWithAllArgsConstructor() {
            LocalDateTime date = LocalDateTime.now();
            
            LeaderboardEntry entry = new LeaderboardEntry(
                    3, "user3", 90.5, 70, 85, "GALAXY", date
            );

            assertEquals(3, entry.getRank());
            assertEquals("user3", entry.getUsername());
            assertEquals(90.5, entry.getScore());
            assertEquals(70, entry.getWpm());
            assertEquals(85, entry.getAccuracy());
            assertEquals("GALAXY", entry.getGameName());
            assertEquals(date, entry.getDateAchieved());
        }
    }
}
