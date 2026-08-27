package com.syntaxtype.demo.core.security;

import com.syntaxtype.demo.core.enums.Role;
import com.syntaxtype.demo.features.user.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Authorization boundary tests.
 *
 * These endpoints were reachable by the wrong callers: any student could read the whole
 * roster, edit another student's profile, PATCH their own words-per-minute, or award
 * themselves a badge. The role annotations alone never expressed "that student" — only "a
 * student" — so the rules need tests that actually drive requests.
 *
 * Deliberately asserts on the authorization boundary and nothing else. A denied call must be
 * 403; an allowed call must be anything *other* than 403, because whether it then returns
 * 200, 404 or 400 depends on fixture data this test does not create. Asserting 200 would tie
 * a security test to service behaviour and make it fail for unrelated reasons.
 *
 * The full context is booted rather than a @WebMvcTest slice because @PreAuthorize needs
 * SecurityConfig's @EnableMethodSecurity, and the ownership checks need a real
 * CustomUserDetails principal — @WithMockUser supplies Spring's own User type, which would
 * make AccessGuard reject the call for the wrong reason and turn these green by accident.
 */
@SpringBootTest
@AutoConfigureMockMvc
class AuthorizationBoundaryTest {

    private static final long ALICE = 101L;   // the caller
    private static final long BOB = 202L;     // somebody else

    @Autowired
    private MockMvc mockMvc;

    /** Authenticates as a real CustomUserDetails, the way JwtAuthFilter does in production. */
    private static RequestPostProcessor as(long userId, Role role) {
        User user = new User();
        user.setUserId(userId);
        user.setUsername("user" + userId);
        user.setUserRole(role);
        CustomUserDetails principal = new CustomUserDetails(user);
        return authentication(
                new UsernamePasswordAuthenticationToken(principal, "n/a", principal.getAuthorities()));
    }

    private void assertForbidden(org.springframework.test.web.servlet.RequestBuilder request) throws Exception {
        mockMvc.perform(request).andExpect(status().isForbidden());
    }

    /** Allowed = the authorization layer let it through, whatever the handler then did. */
    private void assertNotForbidden(org.springframework.test.web.servlet.RequestBuilder request) throws Exception {
        int status = mockMvc.perform(request).andReturn().getResponse().getStatus();
        assertThat(status)
                .as("authorization should have allowed this call")
                .isNotEqualTo(403);
    }

    @Nested
    @DisplayName("Student roster is staff-only")
    class RosterReads {

        @Test
        void studentCannotListEveryStudent() throws Exception {
            assertForbidden(get("/api/students").with(as(ALICE, Role.STUDENT)));
        }

        @Test
        void studentCannotEnumerateBySection() throws Exception {
            assertForbidden(get("/api/students/section/A").with(as(ALICE, Role.STUDENT)));
        }

        @Test
        void teacherCanListEveryStudent() throws Exception {
            assertNotForbidden(get("/api/students").with(as(ALICE, Role.TEACHER)));
        }
    }

    @Nested
    @DisplayName("A student profile is reachable only by its owner or staff")
    class ProfileScoping {

        @Test
        void studentCannotReadAnotherStudentsProfile() throws Exception {
            assertForbidden(get("/api/students/user/" + BOB).with(as(ALICE, Role.STUDENT)));
        }

        @Test
        void studentCanReadTheirOwnProfile() throws Exception {
            assertNotForbidden(get("/api/students/user/" + ALICE).with(as(ALICE, Role.STUDENT)));
        }

        @Test
        void studentCannotRenameAnotherStudent() throws Exception {
            assertForbidden(patch("/api/students/" + BOB + "/first-name")
                    .param("newFirstName", "Mallory")
                    .with(as(ALICE, Role.STUDENT)));
        }

        @Test
        void studentCanRenameThemselves() throws Exception {
            assertNotForbidden(patch("/api/students/" + ALICE + "/first-name")
                    .param("newFirstName", "Alice")
                    .with(as(ALICE, Role.STUDENT)));
        }

        @Test
        void studentCannotDeleteAnotherStudent() throws Exception {
            assertForbidden(delete("/api/students/" + BOB).with(as(ALICE, Role.STUDENT)));
        }

        @Test
        void studentCannotCreateAProfileForSomebodyElse() throws Exception {
            assertForbidden(post("/api/students")
                    .param("userId", String.valueOf(BOB))
                    .contentType("application/json")
                    .content("{}")
                    .with(as(ALICE, Role.STUDENT)));
        }
    }

    @Nested
    @DisplayName("Study figures cannot be written by the people they measure")
    class StudyDataIntegrity {

        @Test
        void studentCannotPatchTheirOwnWordsPerMinute() throws Exception {
            assertForbidden(patch("/api/user-statistics/1/words-per-minute")
                    .param("newWpm", "999")
                    .with(as(ALICE, Role.STUDENT)));
        }

        @Test
        void studentCannotPatchTheirOwnAccuracy() throws Exception {
            assertForbidden(patch("/api/user-statistics/1/accuracy")
                    .param("newAccuracy", "100")
                    .with(as(ALICE, Role.STUDENT)));
        }

        @Test
        void studentCannotReadAnotherUsersStatistics() throws Exception {
            assertForbidden(get("/api/user-statistics/user")
                    .param("userId", String.valueOf(BOB))
                    .with(as(ALICE, Role.STUDENT)));
        }

        @Test
        void studentCanReadTheirOwnStatistics() throws Exception {
            assertNotForbidden(get("/api/user-statistics/user")
                    .param("userId", String.valueOf(ALICE))
                    .with(as(ALICE, Role.STUDENT)));
        }

        @Test
        void teacherCanReadAStudentsStatisticsForTheClassDashboard() throws Exception {
            assertNotForbidden(get("/api/user-statistics/user")
                    .param("userId", String.valueOf(BOB))
                    .with(as(ALICE, Role.TEACHER)));
        }

        @Test
        void plainUserCannotEditTheLeaderboard() throws Exception {
            assertForbidden(patch("/api/leaderboards/1/words-per-minute")
                    .param("newWpm", "999")
                    .with(as(ALICE, Role.USER)));
        }

        @Test
        void studentCannotEditALessonAttempt() throws Exception {
            assertForbidden(patch("/api/lesson-attempts/1/wpm")
                    .param("newWpm", "999")
                    .with(as(ALICE, Role.STUDENT)));
        }
    }

    @Nested
    @DisplayName("Badges are granted by the server, not claimed by the student")
    class BadgeAwards {

        @Test
        void studentCannotAwardThemselvesABadge() throws Exception {
            assertForbidden(post("/api/student-achievements")
                    .param("studentId", String.valueOf(ALICE))
                    .param("achievementId", "1")
                    .contentType("application/json")
                    .content("{}")
                    .with(as(ALICE, Role.STUDENT)));
        }

        @Test
        void studentCannotRepointAnExistingAward() throws Exception {
            assertForbidden(patch("/api/student-achievements/1/student")
                    .param("newStudentId", String.valueOf(ALICE))
                    .with(as(ALICE, Role.STUDENT)));
        }

        @Test
        void studentCannotReadAnotherStudentsBadges() throws Exception {
            assertForbidden(get("/api/student-achievements/by-student")
                    .param("studentId", String.valueOf(BOB))
                    .with(as(ALICE, Role.STUDENT)));
        }

        @Test
        void studentCanReadTheirOwnBadges() throws Exception {
            assertNotForbidden(get("/api/student-achievements/by-student")
                    .param("studentId", String.valueOf(ALICE))
                    .with(as(ALICE, Role.STUDENT)));
        }
    }

    @Nested
    @DisplayName("Controllers that previously carried no authorization at all")
    class PreviouslyUnguarded {

        @Test
        void plainUserCannotListStudentTopicProgress() throws Exception {
            assertForbidden(get("/api/student-topics").with(as(ALICE, Role.USER)));
        }

        @Test
        void studentCannotDeleteTopicProgress() throws Exception {
            assertForbidden(delete("/api/student-topics/1/1").with(as(ALICE, Role.STUDENT)));
        }

        @Test
        void plainUserCannotTouchTeacherTopics() throws Exception {
            assertForbidden(get("/api/teacher-topics").with(as(ALICE, Role.USER)));
        }

        @Test
        void studentCannotAuthorALesson() throws Exception {
            assertForbidden(post("/api/lessons")
                    .contentType("application/json")
                    .content("{\"title\":\"<img src=x onerror=alert(1)>\"}")
                    .with(as(ALICE, Role.STUDENT)));
        }

        @Test
        void studentCannotDeleteALesson() throws Exception {
            assertForbidden(delete("/api/lessons/1").with(as(ALICE, Role.STUDENT)));
        }

        @Test
        void studentCanStillReadLessons() throws Exception {
            assertNotForbidden(get("/api/lessons").with(as(ALICE, Role.STUDENT)));
        }

        @Test
        void studentCannotDeleteGameContent() throws Exception {
            assertForbidden(delete("/api/challenges/1").with(as(ALICE, Role.STUDENT)));
        }

        @Test
        void studentCanStillPlayGameContent() throws Exception {
            assertNotForbidden(get("/api/challenges").with(as(ALICE, Role.STUDENT)));
        }

        @Test
        void studentCannotEditAQuiz() throws Exception {
            assertForbidden(put("/api/quiz/1")
                    .contentType("application/json")
                    .content("{}")
                    .with(as(ALICE, Role.STUDENT)));
        }
    }
}
