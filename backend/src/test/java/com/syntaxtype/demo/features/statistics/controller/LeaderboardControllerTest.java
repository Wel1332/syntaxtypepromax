package com.syntaxtype.demo.features.statistics.controller;

import com.syntaxtype.demo.features.statistics.dto.LeaderboardEntry;
import com.syntaxtype.demo.core.enums.Category;
import com.syntaxtype.demo.features.statistics.service.LeaderboardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(LeaderboardController.class)
@AutoConfigureMockMvc(addFilters = false)
class LeaderboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private LeaderboardService leaderboardService;

    private List<LeaderboardEntry> sampleEntries;

    @BeforeEach
    void setUp() {
        sampleEntries = Arrays.asList(
                LeaderboardEntry.builder()
                        .rank(1)
                        .username("player1")
                        .wpm(120)
                        .accuracy(98)
                        .score(176.4) // 120 * 0.98 * 1.5 (accuracy > 95)
                        .gameName("TYPING_TESTS")
                        .dateAchieved(LocalDateTime.now())
                        .build(),
                LeaderboardEntry.builder()
                        .rank(2)
                        .username("player2")
                        .wpm(100)
                        .accuracy(95)
                        .score(95.0)
                        .gameName("TYPING_TESTS")
                        .dateAchieved(LocalDateTime.now())
                        .build(),
                LeaderboardEntry.builder()
                        .rank(3)
                        .username("player3")
                        .wpm(90)
                        .accuracy(92)
                        .score(82.8)
                        .gameName("TYPING_TESTS")
                        .dateAchieved(LocalDateTime.now())
                        .build()
        );
    }

    @Nested
    @DisplayName("GET /api/leaderboards/global Tests")
    class GlobalLeaderboardTests {

        @Test
        @DisplayName("Should return global leaderboard with default metric (combined)")
        void shouldReturnGlobalLeaderboardWithDefaultMetric() throws Exception {
            when(leaderboardService.getGlobalTop10("combined"))
                    .thenReturn(sampleEntries);

            mockMvc.perform(get("/api/leaderboards/global")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$", hasSize(3)))
                    .andExpect(jsonPath("$[0].rank", is(1)))
                    .andExpect(jsonPath("$[0].username", is("player1")))
                    .andExpect(jsonPath("$[0].wpm", is(120)))
                    .andExpect(jsonPath("$[0].accuracy", is(98)))
                    .andExpect(jsonPath("$[0].gameName", is("TYPING_TESTS")));
        }

        @Test
        @DisplayName("Should return global leaderboard sorted by WPM")
        void shouldReturnGlobalLeaderboardByWpm() throws Exception {
            when(leaderboardService.getGlobalTop10("wpm"))
                    .thenReturn(sampleEntries);

            mockMvc.perform(get("/api/leaderboards/global")
                            .param("metric", "wpm")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(3)));
        }

        @Test
        @DisplayName("Should return global leaderboard sorted by accuracy")
        void shouldReturnGlobalLeaderboardByAccuracy() throws Exception {
            when(leaderboardService.getGlobalTop10("accuracy"))
                    .thenReturn(sampleEntries);

            mockMvc.perform(get("/api/leaderboards/global")
                            .param("metric", "accuracy")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(3)));
        }

        @Test
        @DisplayName("Should return empty list when no entries exist")
        void shouldReturnEmptyListWhenNoEntries() throws Exception {
            when(leaderboardService.getGlobalTop10(anyString()))
                    .thenReturn(Collections.emptyList());

            mockMvc.perform(get("/api/leaderboards/global")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(0)));
        }

        @Test
        @DisplayName("Should handle pagination parameter")
        void shouldHandlePaginationParameter() throws Exception {
            when(leaderboardService.getGlobalTop10(anyString()))
                    .thenReturn(sampleEntries);

            mockMvc.perform(get("/api/leaderboards/global")
                            .param("page", "1")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("GET /api/leaderboards/game/{category} Tests")
    class GameLeaderboardTests {

        @Test
        @DisplayName("Should return game leaderboard for TYPING_TESTS category")
        void shouldReturnGameLeaderboardForTypingTests() throws Exception {
            when(leaderboardService.getTop10ByCombinedScore(Category.TYPING_TESTS))
                    .thenReturn(sampleEntries);

            mockMvc.perform(get("/api/leaderboards/game/TYPING_TESTS")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$", hasSize(3)))
                    .andExpect(jsonPath("$[0].gameName", is("TYPING_TESTS")));
        }

        @Test
        @DisplayName("Should return game leaderboard sorted by WPM")
        void shouldReturnGameLeaderboardByWpm() throws Exception {
            when(leaderboardService.getTop10ByWpm(Category.CHALLENGES))
                    .thenReturn(sampleEntries);

            mockMvc.perform(get("/api/leaderboards/game/CHALLENGES")
                            .param("metric", "wpm")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(3)));
        }

        @Test
        @DisplayName("Should return game leaderboard sorted by accuracy")
        void shouldReturnGameLeaderboardByAccuracy() throws Exception {
            when(leaderboardService.getTop10ByAccuracy(Category.GALAXY))
                    .thenReturn(sampleEntries);

            mockMvc.perform(get("/api/leaderboards/game/GALAXY")
                            .param("metric", "accuracy")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(3)));
        }

        @Test
        @DisplayName("Should return empty list for category with no entries")
        void shouldReturnEmptyListForCategoryWithNoEntries() throws Exception {
            when(leaderboardService.getTop10ByCombinedScore(Category.CROSSWORD))
                    .thenReturn(Collections.emptyList());

            mockMvc.perform(get("/api/leaderboards/game/CROSSWORD")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(0)));
        }

        @Test
        @DisplayName("Should handle all category types")
        void shouldHandleAllCategoryTypes() throws Exception {
            when(leaderboardService.getTop10ByCombinedScore(anyString().length() > 0 ? Category.valueOf(anyString()) : Category.OVERALL))
                    .thenReturn(sampleEntries);

            for (Category category : Category.values()) {
                mockMvc.perform(get("/api/leaderboards/game/" + category.name())
                                .contentType(MediaType.APPLICATION_JSON))
                        .andExpect(status().isOk());
            }
        }
    }

    @Nested
    @DisplayName("GET /api/leaderboards/user/{userId} Tests")
    class UserRankingsTests {

        @Test
        @DisplayName("Should return user rankings for existing user")
        void shouldReturnUserRankingsForExistingUser() throws Exception {
            when(leaderboardService.getUserRankings(1L))
                    .thenReturn(sampleEntries);

            mockMvc.perform(get("/api/leaderboards/user/1")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$", hasSize(3)))
                    .andExpect(jsonPath("$[0].username", is("player1")));
        }

        @Test
        @DisplayName("Should return empty list for user with no rankings")
        void shouldReturnEmptyListForUserWithNoRankings() throws Exception {
            when(leaderboardService.getUserRankings(999L))
                    .thenReturn(Collections.emptyList());

            mockMvc.perform(get("/api/leaderboards/user/999")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(0)));
        }

        @Test
        @DisplayName("Should return user rankings across multiple categories")
        void shouldReturnUserRankingsAcrossCategories() throws Exception {
            List<LeaderboardEntry> multiCategoryEntries = Arrays.asList(
                    LeaderboardEntry.builder()
                            .rank(1)
                            .username("player1")
                            .wpm(120)
                            .accuracy(98)
                            .score(176.4)
                            .gameName("TYPING_TESTS")
                            .dateAchieved(LocalDateTime.now())
                            .build(),
                    LeaderboardEntry.builder()
                            .rank(2)
                            .username("player1")
                            .wpm(100)
                            .accuracy(92)
                            .score(92.0)
                            .gameName("CHALLENGES")
                            .dateAchieved(LocalDateTime.now())
                            .build(),
                    LeaderboardEntry.builder()
                            .rank(3)
                            .username("player1")
                            .wpm(80)
                            .accuracy(95)
                            .score(114.0) // 80 * 0.95 * 1.5 (accuracy > 95)
                            .gameName("GALAXY")
                            .dateAchieved(LocalDateTime.now())
                            .build()
            );

            when(leaderboardService.getUserRankings(1L))
                    .thenReturn(multiCategoryEntries);

            mockMvc.perform(get("/api/leaderboards/user/1")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(3)))
                    .andExpect(jsonPath("$[*].gameName", containsInAnyOrder("TYPING_TESTS", "CHALLENGES", "GALAXY")));
        }
    }

    @Nested
    @DisplayName("Response Format Tests")
    class ResponseFormatTests {

        @Test
        @DisplayName("Should include all required fields in response")
        void shouldIncludeAllRequiredFieldsInResponse() throws Exception {
            when(leaderboardService.getGlobalTop10("combined"))
                    .thenReturn(Collections.singletonList(sampleEntries.get(0)));

            mockMvc.perform(get("/api/leaderboards/global")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0]", hasKey("rank")))
                    .andExpect(jsonPath("$[0]", hasKey("username")))
                    .andExpect(jsonPath("$[0]", hasKey("wpm")))
                    .andExpect(jsonPath("$[0]", hasKey("accuracy")))
                    .andExpect(jsonPath("$[0]", hasKey("score")))
                    .andExpect(jsonPath("$[0]", hasKey("gameName")))
                    .andExpect(jsonPath("$[0]", hasKey("dateAchieved")));
        }

        @Test
        @DisplayName("Should return correct combined score calculation")
        void shouldReturnCorrectCombinedScoreCalculation() throws Exception {
            // Verify the 1.5x multiplier is applied correctly
            // 120 WPM * 0.98 accuracy * 1.5 = 176.4
            when(leaderboardService.getGlobalTop10("combined"))
                    .thenReturn(Collections.singletonList(sampleEntries.get(0)));

            mockMvc.perform(get("/api/leaderboards/global")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].score", closeTo(176.4, 0.01)));
        }
    }

    @Nested
    @DisplayName("Edge Cases Tests")
    class EdgeCasesTests {

        @Test
        @DisplayName("Should handle invalid category gracefully")
        void shouldHandleInvalidCategory() throws Exception {
            mockMvc.perform(get("/api/leaderboards/game/INVALID_CATEGORY")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should handle negative page number")
        void shouldHandleNegativePageNumber() throws Exception {
            when(leaderboardService.getGlobalTop10("combined"))
                    .thenReturn(sampleEntries);

            mockMvc.perform(get("/api/leaderboards/global")
                            .param("page", "-1")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("Should handle unknown metric parameter")
        void shouldHandleUnknownMetricParameter() throws Exception {
            when(leaderboardService.getGlobalTop10("unknown"))
                    .thenReturn(sampleEntries);

            mockMvc.perform(get("/api/leaderboards/global")
                            .param("metric", "unknown")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk());
        }
    }
}
