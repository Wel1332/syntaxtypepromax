package com.syntaxtype.demo.features.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import com.syntaxtype.demo.core.enums.Role;
import com.syntaxtype.demo.features.user.entity.User;
import com.syntaxtype.demo.features.user.repository.UserRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Changing your own password: PATCH /api/users/me/password.
 *
 * Every test logs in through /api/auth/login and sends the real Bearer token, so
 * JwtAuthFilter runs exactly as it does in production. That is the point: the
 * property most worth guarding is that a change ends every other session, and
 * only the filter can enforce that. A mocked principal would skip it and pass.
 *
 * /api/health is the "is this token still accepted?" probe. It needs an
 * authenticated caller and does nothing else, so 200 versus 403 there isolates
 * the token check from any endpoint's own logic.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Changing your own password")
class ChangeOwnPasswordTest {

    private static final String ORIGINAL = "original-pass-1";
    private static final String REPLACEMENT = "replacement-pass-2";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${jwt.secret}")
    private String jwtSecret;

    private User student;

    @BeforeEach
    void createStudent() {
        student = createUser(Role.STUDENT);
    }

    private User createUser(Role role) {
        User u = new User();
        u.setUsername("pw-tester-" + System.nanoTime());
        u.setEmail(u.getUsername() + "@example.invalid");
        u.setPassword(passwordEncoder.encode(ORIGINAL));
        u.setUserRole(role);
        return userRepository.save(u);
    }

    private String json(Object body) throws Exception {
        return objectMapper.writeValueAsString(body);
    }

    private ResultActions login(String email, String password) throws Exception {
        return mockMvc.perform(post("/api/auth/login")
                .contentType(APPLICATION_JSON)
                .content(json(Map.of("email", email, "password", password))));
    }

    private String tokenFor(String email, String password) throws Exception {
        String body = login(email, password)
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.token");
    }

    private ResultActions changePassword(String token, String current, String replacement) throws Exception {
        Map<String, String> body = new HashMap<>();
        body.put("currentPassword", current);
        body.put("newPassword", replacement);
        MockHttpServletRequestBuilder request = patch("/api/users/me/password")
                .contentType(APPLICATION_JSON)
                .content(json(body));
        if (token != null) {
            request.header("Authorization", "Bearer " + token);
        }
        return mockMvc.perform(request);
    }

    private String newTokenFrom(ResultActions result) throws Exception {
        return JsonPath.read(result.andReturn().getResponse().getContentAsString(), "$.token");
    }

    private ResultActions probe(String token) throws Exception {
        return mockMvc.perform(get("/api/health").header("Authorization", "Bearer " + token));
    }

    @Nested
    @DisplayName("a successful change")
    class Success {

        @Test
        @DisplayName("returns a token that works, and the new password logs in")
        void returnsWorkingTokenAndNewPasswordLogsIn() throws Exception {
            String token = tokenFor(student.getEmail(), ORIGINAL);

            ResultActions result = changePassword(token, ORIGINAL, REPLACEMENT).andExpect(status().isOk());

            probe(newTokenFrom(result)).andExpect(status().isOk());
            login(student.getEmail(), REPLACEMENT).andExpect(status().isOk());
        }

        @Test
        @DisplayName("the old password no longer logs in")
        void oldPasswordStopsWorking() throws Exception {
            String token = tokenFor(student.getEmail(), ORIGINAL);

            changePassword(token, ORIGINAL, REPLACEMENT).andExpect(status().isOk());

            login(student.getEmail(), ORIGINAL).andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("ends every session that existed before the change")
        void endsEarlierSessions() throws Exception {
            String thisSession = tokenFor(student.getEmail(), ORIGINAL);
            String otherDevice = tokenFor(student.getEmail(), ORIGINAL);

            String fresh = newTokenFrom(changePassword(thisSession, ORIGINAL, REPLACEMENT)
                    .andExpect(status().isOk()));

            probe(otherDevice).andExpect(status().isForbidden());
            probe(thisSession).andExpect(status().isForbidden());
            probe(fresh).andExpect(status().isOk());
        }

        @Test
        @DisplayName("a login after the change gets a token that keeps working")
        void loginAfterChangeIsAccepted() throws Exception {
            String token = tokenFor(student.getEmail(), ORIGINAL);
            changePassword(token, ORIGINAL, REPLACEMENT).andExpect(status().isOk());

            probe(tokenFor(student.getEmail(), REPLACEMENT)).andExpect(status().isOk());
        }

        @Test
        @DisplayName("an admin can change their own password")
        void adminCanChangeOwnPassword() throws Exception {
            User admin = createUser(Role.ADMIN);
            String token = tokenFor(admin.getEmail(), ORIGINAL);

            changePassword(token, ORIGINAL, REPLACEMENT).andExpect(status().isOk());

            login(admin.getEmail(), REPLACEMENT).andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("a rejected change")
    class Rejected {

        @Test
        @DisplayName("without a login is refused")
        void requiresLogin() throws Exception {
            changePassword(null, ORIGINAL, REPLACEMENT).andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("with the wrong current password leaves the password unchanged")
        void wrongCurrentPassword() throws Exception {
            String token = tokenFor(student.getEmail(), ORIGINAL);

            changePassword(token, "not-the-password", REPLACEMENT)
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Current password is incorrect."));

            login(student.getEmail(), ORIGINAL).andExpect(status().isOk());
            probe(token).andExpect(status().isOk());
        }

        @Test
        @DisplayName("wrong guesses count toward the same lockout as login")
        void wrongGuessesShareTheLoginLockout() throws Exception {
            String token = tokenFor(student.getEmail(), ORIGINAL);

            // Ten is LoginAttemptService.MAX_ATTEMPTS. If this endpoint kept its own
            // counter, a stolen token would get ten more guesses at the password.
            for (int i = 0; i < 10; i++) {
                changePassword(token, "guess-" + i, REPLACEMENT).andExpect(status().isBadRequest());
            }

            changePassword(token, ORIGINAL, REPLACEMENT).andExpect(status().isTooManyRequests());
            login(student.getEmail(), ORIGINAL).andExpect(status().isTooManyRequests());
        }

        @Test
        @DisplayName("with a new password shorter than 8 characters")
        void tooShort() throws Exception {
            String token = tokenFor(student.getEmail(), ORIGINAL);

            changePassword(token, ORIGINAL, "short7!")
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("New password must be at least 8 characters."));
        }

        @Test
        @DisplayName("with a new password over bcrypt's 72-byte limit, counted in bytes")
        void tooLong() throws Exception {
            String token = tokenFor(student.getEmail(), ORIGINAL);
            // 25 characters, but '€' is 3 bytes in UTF-8, so 75 bytes. Counting
            // characters would accept it and bcrypt would then throw a 500.
            String multiByte = "€".repeat(25);

            changePassword(token, ORIGINAL, multiByte)
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("New password must be at most 72 bytes."));
            changePassword(token, ORIGINAL, "a".repeat(73)).andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("with a new password the same as the current one")
        void sameAsCurrent() throws Exception {
            String token = tokenFor(student.getEmail(), ORIGINAL);

            changePassword(token, ORIGINAL, ORIGINAL)
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("New password must be different from the current one."));
        }

        @Test
        @DisplayName("with no new password")
        void missingNewPassword() throws Exception {
            String token = tokenFor(student.getEmail(), ORIGINAL);

            changePassword(token, ORIGINAL, null)
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("New password is required."));
        }
    }

    @Nested
    @DisplayName("existing behaviour that must not change")
    class Unchanged {

        @Test
        @DisplayName("tokens issued before this feature existed stay valid")
        void tokensWithoutAVersionStillWork() throws Exception {
            // Signed the way the previous JwtUtil signed tokens, with no password
            // version claim. Every student logged in at deploy time holds one of
            // these; rejecting them would log the whole class out mid-session.
            String legacy = Jwts.builder()
                    .subject(student.getUsername())
                    .claim("role", student.getUserRole().toString())
                    .claim("id", student.getUserId())
                    .claim("isTempPassword", false)
                    .issuedAt(new Date())
                    .expiration(new Date(System.currentTimeMillis() + 60_000))
                    .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes()))
                    .compact();

            probe(legacy).andExpect(status().isOk());
        }

        @Test
        @DisplayName("teacher account setup still returns a working token")
        void teacherSetupStillWorks() throws Exception {
            User teacher = createUser(Role.TEACHER);
            assertThat(teacher.isTempPassword()).as("new teachers start on a temporary password").isTrue();
            String token = tokenFor(teacher.getEmail(), ORIGINAL);

            String body = mockMvc.perform(put("/api/users/update-temp-teacher/" + teacher.getUserId())
                            .header("Authorization", "Bearer " + token)
                            .contentType(APPLICATION_JSON)
                            .content(json(Map.of("password", REPLACEMENT))))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();

            probe(JsonPath.read(body, "$.token")).andExpect(status().isOk());
            login(teacher.getEmail(), REPLACEMENT).andExpect(status().isOk());
        }
    }
}
