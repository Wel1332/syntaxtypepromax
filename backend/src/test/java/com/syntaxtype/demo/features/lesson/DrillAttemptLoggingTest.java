package com.syntaxtype.demo.features.lesson;

import com.syntaxtype.demo.core.enums.Role;
import com.syntaxtype.demo.core.security.CustomUserDetails;
import com.syntaxtype.demo.features.lesson.entity.DrillAttempt;
import com.syntaxtype.demo.features.lesson.repository.DrillAttemptRepository;
import com.syntaxtype.demo.features.lesson.repository.ScoreRepository;
import com.syntaxtype.demo.features.user.entity.User;
import com.syntaxtype.demo.features.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Per-drill logging (Objective 2.3).
 *
 * A session used to be stored as a single aggregate row, so "which drills were
 * missed, how long each took, and which punctuation token they failed on" could
 * not be recovered afterwards. These tests pin the two properties that matter:
 * the detail is actually written, and a client that sends none still works.
 *
 * The second is the one worth guarding. Two of the four game modes do not send
 * drill detail, and a change that made `drills` mandatory would break score
 * submission for them — silently, in the middle of the study.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Per-drill logging")
class DrillAttemptLoggingTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DrillAttemptRepository drillAttemptRepository;

    @Autowired
    private ScoreRepository scoreRepository;

    private User student;

    @BeforeEach
    void createStudent() {
        drillAttemptRepository.deleteAll();
        scoreRepository.deleteAll();

        User u = new User();
        u.setUsername("drill-tester-" + System.nanoTime());
        u.setEmail(u.getUsername() + "@example.invalid");
        u.setPassword("irrelevant");
        u.setUserRole(Role.STUDENT);
        student = userRepository.save(u);
    }

    private RequestPostProcessor asStudent() {
        CustomUserDetails principal = new CustomUserDetails(student);
        return authentication(
                new UsernamePasswordAuthenticationToken(principal, "n/a", principal.getAuthorities()));
    }

    @Test
    @DisplayName("stores one row per drill, in the order presented")
    void storesPerDrillDetail() throws Exception {
        String body = """
                {
                  "score": 320, "accuracy": 67, "wpm": 0, "modeType": "PRE_TEST",
                  "correctCount": 2, "totalCount": 3, "errorCount": 4,
                  "drills": [
                    {"itemId":"P-01","difficulty":"easy","cleared":true,"timeMs":4200,"misses":0},
                    {"itemId":"P-02","difficulty":"easy","cleared":false,"timeMs":25000,"misses":3,
                     "errorCategory":"missing-semicolon"},
                    {"itemId":"P-07","difficulty":"hard","cleared":true,"timeMs":9100,"misses":1}
                  ]
                }
                """;

        mockMvc.perform(post("/api/scores/SYNTAX_SAVER")
                        .contentType("application/json").content(body)
                        .with(asStudent()))
                .andExpect(status().isOk());

        List<DrillAttempt> rows = drillAttemptRepository.findAllWithSessionAndUser();
        assertThat(rows).hasSize(3);

        assertThat(rows).extracting(DrillAttempt::getPosition).containsExactly(1, 2, 3);
        assertThat(rows).extracting(DrillAttempt::getItemId).containsExactly("P-01", "P-02", "P-07");
        assertThat(rows).extracting(DrillAttempt::isCleared).containsExactly(true, false, true);
        assertThat(rows).extracting(DrillAttempt::getTimeMs).containsExactly(4200, 25000, 9100);

        // The missed drill keeps its category; the cleared ones must not invent one,
        // or the error distribution would count successes as failures.
        assertThat(rows.get(1).getErrorCategory()).isEqualTo("missing-semicolon");
        assertThat(rows.get(0).getErrorCategory()).isNull();
        assertThat(rows.get(2).getErrorCategory()).isNull();
    }

    @Test
    @DisplayName("a cleared drill never carries an error category, even if the client sends one")
    void clearedDrillsHaveNoErrorCategory() throws Exception {
        String body = """
                {
                  "score": 100, "accuracy": 100, "wpm": 0, "modeType": "PRACTICE",
                  "drills": [
                    {"itemId":"P-01","cleared":true,"timeMs":3000,"misses":0,
                     "errorCategory":"missing-semicolon"}
                  ]
                }
                """;

        mockMvc.perform(post("/api/scores/SYNTAX_SAVER")
                        .contentType("application/json").content(body)
                        .with(asStudent()))
                .andExpect(status().isOk());

        assertThat(drillAttemptRepository.findAllWithSessionAndUser())
                .singleElement()
                .satisfies(row -> assertThat(row.getErrorCategory()).isNull());
    }

    @Test
    @DisplayName("a submission with no drill list still saves the session")
    void submissionWithoutDrillsStillWorks() throws Exception {
        String body = """
                {"score": 250, "accuracy": 90, "wpm": 42, "modeType": "POST_TEST",
                 "correctCount": 5, "totalCount": 6, "errorCount": 1}
                """;

        mockMvc.perform(post("/api/scores/FALLING_WORDS")
                        .contentType("application/json").content(body)
                        .with(asStudent()))
                .andExpect(status().isOk());

        assertThat(scoreRepository.findAll()).hasSize(1);
        assertThat(drillAttemptRepository.findAll()).isEmpty();
    }

    @Test
    @DisplayName("an empty drill list is not an error")
    void emptyDrillListIsAccepted() throws Exception {
        String body = """
                {"score": 10, "accuracy": 100, "wpm": 0, "modeType": "PRACTICE", "drills": []}
                """;

        mockMvc.perform(post("/api/scores/SYNTAX_SAVER")
                        .contentType("application/json").content(body)
                        .with(asStudent()))
                .andExpect(status().isOk());

        assertThat(scoreRepository.findAll()).hasSize(1);
        assertThat(drillAttemptRepository.findAll()).isEmpty();
    }

    @Test
    @DisplayName("position comes from list order, not from the client")
    void positionIsAssignedByTheServer() throws Exception {
        // Every entry claims to be first. Trusting a client-supplied position would
        // make the session order unreconstructable.
        String body = """
                {
                  "score": 50, "accuracy": 50, "wpm": 0, "modeType": "PRE_TEST",
                  "drills": [
                    {"itemId":"A","position":1,"cleared":true,"timeMs":1000},
                    {"itemId":"B","position":1,"cleared":true,"timeMs":2000}
                  ]
                }
                """;

        mockMvc.perform(post("/api/scores/SYNTAX_SAVER")
                        .contentType("application/json").content(body)
                        .with(asStudent()))
                .andExpect(status().isOk());

        assertThat(drillAttemptRepository.findAllWithSessionAndUser())
                .extracting(DrillAttempt::getPosition)
                .containsExactly(1, 2);
    }
}
