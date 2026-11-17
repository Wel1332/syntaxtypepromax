package com.syntaxtype.demo.features.classroom;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import com.syntaxtype.demo.core.enums.Role;
import com.syntaxtype.demo.core.security.CustomUserDetails;
import com.syntaxtype.demo.features.classroom.repository.ClassChallengeAttemptRepository;
import com.syntaxtype.demo.features.classroom.repository.ClassChallengeRepository;
import com.syntaxtype.demo.features.lesson.repository.ScoreRepository;
import com.syntaxtype.demo.features.user.entity.User;
import com.syntaxtype.demo.features.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Class challenges: content a teacher makes for one class.
 *
 * The rule under test is the one the feature exists for: only students who joined
 * the class can see or take what the teacher made for it, and only the teacher who
 * owns the class (or an admin) can manage it. Every request runs through the real
 * controllers, services and database, with classes created and joined through the
 * same endpoints the app uses, so ownership and enrollment are the real ones.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Class challenges")
class ClassChallengeAccessTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private ClassChallengeRepository challengeRepository;
    @Autowired private ClassChallengeAttemptRepository attemptRepository;
    @Autowired private ScoreRepository scoreRepository;

    private User teacher;       // owns the class
    private User otherTeacher;  // owns a different class
    private User student;       // joined the class
    private User outsider;      // a student who did not join
    private User admin;
    private long classId;
    private long otherClassId;

    // ── fixtures ──────────────────────────────────────────────────────────

    @BeforeEach
    void setUp() throws Exception {
        teacher = user(Role.TEACHER);
        otherTeacher = user(Role.TEACHER);
        student = user(Role.STUDENT);
        outsider = user(Role.STUDENT);
        admin = user(Role.ADMIN);

        String created = mockMvc.perform(post("/api/classes").with(as(teacher))
                        .contentType(APPLICATION_JSON).content(json(Map.of("name", "Section A"))))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        classId = ((Number) JsonPath.read(created, "$.classroomId")).longValue();
        String code = JsonPath.read(created, "$.classCode");

        String other = mockMvc.perform(post("/api/classes").with(as(otherTeacher))
                        .contentType(APPLICATION_JSON).content(json(Map.of("name", "Section B"))))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        otherClassId = ((Number) JsonPath.read(other, "$.classroomId")).longValue();

        mockMvc.perform(post("/api/classes/join").with(as(student))
                        .contentType(APPLICATION_JSON).content(json(Map.of("classCode", code))))
                .andExpect(status().isOk());
    }

    private User user(Role role) {
        User u = new User();
        u.setUsername(role.name().toLowerCase() + "-" + System.nanoTime());
        u.setEmail(u.getUsername() + "@example.invalid");
        u.setPassword("irrelevant");
        u.setUserRole(role);
        return userRepository.save(u);
    }

    private static RequestPostProcessor as(User user) {
        CustomUserDetails principal = new CustomUserDetails(user);
        return authentication(new UsernamePasswordAuthenticationToken(principal, "n/a", principal.getAuthorities()));
    }

    private String json(Object body) throws Exception {
        return objectMapper.writeValueAsString(body);
    }

    private static Map<String, Object> sniperChallenge() {
        Map<String, Object> body = new HashMap<>();
        body.put("game", "SNIPER");
        body.put("title", "Semicolon hunt");
        body.put("instructions", "Fill in every missing semicolon.");
        body.put("items", List.of(
                Map.of("title", "Print", "code", "printf(\"hi\")_", "answers", List.of(";")),
                Map.of("title", "Declare", "code", "int x = 5_", "answers", List.of(";"))));
        return body;
    }

    private static Map<String, Object> withAttempts(Map<String, Object> body, Integer maxAttempts) {
        Map<String, Object> copy = new HashMap<>(body);
        copy.put("maxAttempts", maxAttempts);
        return copy;
    }

    private static Map<String, Object> visible(Map<String, Object> body) {
        Map<String, Object> copy = new HashMap<>(body);
        copy.put("visible", true);
        return copy;
    }

    private ResultActions create(User who, long cls, Map<String, Object> body) throws Exception {
        return mockMvc.perform(post("/api/classes/" + cls + "/challenges").with(as(who))
                .contentType(APPLICATION_JSON).content(json(body)));
    }

    private long createdId(Map<String, Object> body) throws Exception {
        String res = create(teacher, classId, body).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(res, "$.challengeId")).longValue();
    }

    private ResultActions update(User who, long cls, long id, Map<String, Object> body) throws Exception {
        return mockMvc.perform(put("/api/classes/" + cls + "/challenges/" + id).with(as(who))
                .contentType(APPLICATION_JSON).content(json(body)));
    }

    private ResultActions attempt(User who, long id, Map<String, Object> body) throws Exception {
        return mockMvc.perform(post("/api/class-challenges/" + id + "/attempts").with(as(who))
                .contentType(APPLICATION_JSON).content(json(body)));
    }

    private static Map<String, Object> goodAttempt() {
        return Map.of("score", 120, "correctCount", 2, "totalCount", 2, "accuracy", 100, "durationSeconds", 30);
    }

    // ── teacher side ──────────────────────────────────────────────────────

    @Nested
    @DisplayName("managing challenges")
    class Managing {

        @Test
        @DisplayName("the owning teacher creates a challenge, hidden by default")
        void ownerCreatesHidden() throws Exception {
            create(teacher, classId, sniperChallenge())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.visible").value(false))
                    .andExpect(jsonPath("$.itemCount").value(2))
                    .andExpect(jsonPath("$.game").value("SNIPER"));

            mockMvc.perform(get("/api/classes/" + classId + "/challenges").with(as(teacher)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(1)));
        }

        @Test
        @DisplayName("another teacher is refused every action on the class")
        void otherTeacherRefused() throws Exception {
            long id = createdId(sniperChallenge());
            String base = "/api/classes/" + classId + "/challenges";

            create(otherTeacher, classId, sniperChallenge()).andExpect(status().isForbidden());
            mockMvc.perform(get(base).with(as(otherTeacher))).andExpect(status().isForbidden());
            mockMvc.perform(get(base + "/" + id).with(as(otherTeacher))).andExpect(status().isForbidden());
            update(otherTeacher, classId, id, visible(sniperChallenge())).andExpect(status().isForbidden());
            mockMvc.perform(delete(base + "/" + id).with(as(otherTeacher))).andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("a challenge can't be reached through a different class's address")
        void wrongClassPath() throws Exception {
            long id = createdId(sniperChallenge());

            mockMvc.perform(get("/api/classes/" + otherClassId + "/challenges/" + id).with(as(otherTeacher)))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("students can't use the teacher endpoints, even in their own class")
        void studentsCantManage() throws Exception {
            create(student, classId, sniperChallenge()).andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("an admin can manage any class")
        void adminCanManage() throws Exception {
            create(admin, classId, sniperChallenge()).andExpect(status().isOk());
        }

        @Test
        @DisplayName("the game can't be switched after creation")
        void gameIsFixed() throws Exception {
            long id = createdId(sniperChallenge());
            Map<String, Object> asTranslation = new HashMap<>(sniperChallenge());
            asTranslation.put("game", "TRANSLATION");
            asTranslation.put("items", List.of(Map.of("prompt", "Declare x", "solution", "int x;")));

            update(teacher, classId, id, asTranslation).andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("deleting a challenge also deletes its attempts")
        void deleteRemovesAttempts() throws Exception {
            long id = createdId(visible(sniperChallenge()));
            attempt(student, id, goodAttempt()).andExpect(status().isOk());

            mockMvc.perform(delete("/api/classes/" + classId + "/challenges/" + id).with(as(teacher)))
                    .andExpect(status().isNoContent());

            assertThat(challengeRepository.findById(id)).isEmpty();
            assertThat(attemptRepository.findAll()).noneMatch(a -> a.getChallenge().getChallengeId() == id);
        }

        @Test
        @DisplayName("deleting a class that has challenges and attempts still works")
        void deletingClassStillWorks() throws Exception {
            long id = createdId(visible(sniperChallenge()));
            attempt(student, id, goodAttempt()).andExpect(status().isOk());

            mockMvc.perform(delete("/api/classes/" + classId).with(as(teacher)))
                    .andExpect(status().isNoContent());

            assertThat(challengeRepository.findById(id)).isEmpty();
        }
    }

    // ── validation ────────────────────────────────────────────────────────

    static Stream<Arguments> invalidChallenges() {
        return Stream.of(
                Arguments.of("Syntax Sniper code with more blanks than answers",
                        Map.of("game", "SNIPER", "title", "T",
                                "items", List.of(Map.of("title", "t", "code", "a_ b_", "answers", List.of(";")))),
                        "Item 1: the code has 2 blanks (_) but 1 answer."),
                Arguments.of("Syntax Sniper answer longer than one key",
                        Map.of("game", "SNIPER", "title", "T",
                                "items", List.of(Map.of("title", "t", "code", "x_", "answers", List.of(";;")))),
                        "Item 1: each answer must be exactly one character."),
                Arguments.of("Bug Smasher with fewer than 4 lines",
                        Map.of("game", "FALLING", "title", "T",
                                "items", List.of(Map.of("buggy", "int x = 1", "correct", "int x = 1;"))),
                        "Bug Smasher needs at least 4 items."),
                Arguments.of("Bug Smasher line whose fix is identical",
                        Map.of("game", "FALLING", "title", "T", "items", List.of(
                                Map.of("buggy", "a", "correct", "a"), Map.of("buggy", "b", "correct", "b;"),
                                Map.of("buggy", "c", "correct", "c;"), Map.of("buggy", "d", "correct", "d;"))),
                        "Item 1: the buggy line and the correct line must differ."),
                Arguments.of("Translation Terminal prompt without a solution",
                        Map.of("game", "TRANSLATION", "title", "T",
                                "items", List.of(Map.of("prompt", "Declare x"))),
                        "Item 1: solution is required."),
                Arguments.of("missing title",
                        Map.of("game", "TRANSLATION",
                                "items", List.of(Map.of("prompt", "p", "solution", "s"))),
                        "Title is required."),
                Arguments.of("no items",
                        Map.of("game", "TRANSLATION", "title", "T", "items", List.of()),
                        "Add at least one item."),
                Arguments.of("attempt limit of zero",
                        Map.of("game", "TRANSLATION", "title", "T", "maxAttempts", 0,
                                "items", List.of(Map.of("prompt", "p", "solution", "s"))),
                        "Attempt limit must be between 1 and 100, or empty for unlimited."));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("invalidChallenges")
    @DisplayName("rejects a challenge the game can't play, with a reason the teacher can act on")
    void rejectsInvalid(String caseName, Map<String, Object> body, String message) throws Exception {
        create(teacher, classId, body)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(message));
    }

    @Test
    @DisplayName("accepts a valid challenge for each game")
    void acceptsEachGame() throws Exception {
        create(teacher, classId, sniperChallenge()).andExpect(status().isOk());
        create(teacher, classId, Map.of("game", "TRANSLATION", "title", "Declarations",
                "items", List.of(Map.of("prompt", "Declare an int named score set to 0.", "solution", "int score = 0;"))))
                .andExpect(status().isOk());
        create(teacher, classId, Map.of("game", "FALLING", "title", "Missing semicolons", "items", List.of(
                Map.of("buggy", "int a = 1", "correct", "int a = 1;"),
                Map.of("buggy", "int b = 2", "correct", "int b = 2;"),
                Map.of("buggy", "return 0", "correct", "return 0;"),
                Map.of("buggy", "x++", "correct", "x++;"))))
                .andExpect(status().isOk());
    }

    // ── student side ──────────────────────────────────────────────────────

    @Nested
    @DisplayName("what students can see")
    class Seeing {

        @Test
        @DisplayName("a hidden challenge is invisible even to the class")
        void hiddenIsInvisible() throws Exception {
            long id = createdId(sniperChallenge());

            mockMvc.perform(get("/api/class-challenges").with(as(student)))
                    .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(0)));
            mockMvc.perform(get("/api/class-challenges/" + id).with(as(student)))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("once shown, a student in the class can list it and open it")
        void shownReachesClass() throws Exception {
            long id = createdId(visible(sniperChallenge()));

            mockMvc.perform(get("/api/class-challenges").with(as(student)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(1)))
                    .andExpect(jsonPath("$[0].title").value("Semicolon hunt"))
                    .andExpect(jsonPath("$[0].classroomName").value("Section A"))
                    .andExpect(jsonPath("$[0].items").doesNotExist());
            mockMvc.perform(get("/api/class-challenges/" + id).with(as(student)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.items", hasSize(2)));
        }

        @Test
        @DisplayName("a student who didn't join never sees it, and it looks like it doesn't exist")
        void outsiderNeverSees() throws Exception {
            long id = createdId(visible(sniperChallenge()));

            mockMvc.perform(get("/api/class-challenges").with(as(outsider)))
                    .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(0)));
            mockMvc.perform(get("/api/class-challenges/" + id).with(as(outsider)))
                    .andExpect(status().isNotFound());
            attempt(outsider, id, goodAttempt()).andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("a student removed from the class loses access immediately")
        void removedLosesAccess() throws Exception {
            long id = createdId(visible(sniperChallenge()));
            mockMvc.perform(get("/api/class-challenges/" + id).with(as(student))).andExpect(status().isOk());

            mockMvc.perform(delete("/api/classes/" + classId + "/students/" + student.getUserId()).with(as(teacher)))
                    .andExpect(status().isNoContent());

            mockMvc.perform(get("/api/class-challenges/" + id).with(as(student))).andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("hiding a challenge again takes it away from students")
        void hidingAgainRemovesAccess() throws Exception {
            long id = createdId(visible(sniperChallenge()));

            update(teacher, classId, id, sniperChallenge()).andExpect(status().isOk());

            mockMvc.perform(get("/api/class-challenges/" + id).with(as(student))).andExpect(status().isNotFound());
            attempt(student, id, goodAttempt()).andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("teachers use their own endpoints, not the student ones")
        void teachersCantUseStudentEndpoints() throws Exception {
            mockMvc.perform(get("/api/class-challenges").with(as(teacher))).andExpect(status().isForbidden());
        }
    }

    // ── attempts ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("attempts")
    class Attempts {

        @Test
        @DisplayName("stop at the teacher's limit")
        void limitIsEnforced() throws Exception {
            long id = createdId(visible(withAttempts(sniperChallenge(), 2)));

            attempt(student, id, goodAttempt()).andExpect(status().isOk())
                    .andExpect(jsonPath("$.attemptsUsed").value(1)).andExpect(jsonPath("$.attemptsRemaining").value(1));
            attempt(student, id, goodAttempt()).andExpect(status().isOk())
                    .andExpect(jsonPath("$.attemptsRemaining").value(0));
            attempt(student, id, goodAttempt()).andExpect(status().isConflict())
                    .andExpect(jsonPath("$.message").value("You have used all 2 attempts for this challenge."));

            mockMvc.perform(get("/api/class-challenges").with(as(student)))
                    .andExpect(jsonPath("$[0].attemptsUsed").value(2))
                    .andExpect(jsonPath("$[0].maxAttempts").value(2));
        }

        @Test
        @DisplayName("are unlimited when the teacher sets no limit")
        void unlimitedByDefault() throws Exception {
            long id = createdId(visible(sniperChallenge()));

            for (int i = 0; i < 5; i++) {
                attempt(student, id, goodAttempt()).andExpect(status().isOk())
                        .andExpect(jsonPath("$.attemptsRemaining").doesNotExist());
            }
        }

        @Test
        @DisplayName("reject results that can't be true")
        void rejectsImpossibleResults() throws Exception {
            long id = createdId(visible(sniperChallenge()));

            attempt(student, id, Map.of("score", 10, "correctCount", 5, "totalCount", 2, "accuracy", 100))
                    .andExpect(status().isBadRequest());
            attempt(student, id, Map.of("score", 10, "correctCount", 1, "totalCount", 2, "accuracy", 150))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("never touch the shared scores, so leaderboards and study data stay as they were")
        void scoresUntouched() throws Exception {
            long id = createdId(visible(sniperChallenge()));
            long before = scoreRepository.count();

            attempt(student, id, goodAttempt()).andExpect(status().isOk());
            attempt(student, id, goodAttempt()).andExpect(status().isOk());

            assertThat(scoreRepository.count()).isEqualTo(before);
        }
    }
}
