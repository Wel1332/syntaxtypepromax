package com.syntaxtype.demo.core.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * CORS preflight: what a browser asks before any cross-origin request that is
 * not a plain GET or POST.
 *
 * PATCH was missing from the allowed methods, so every browser refused to send
 * PATCH /api/users/me/password and the Change password page could never work.
 * Nothing else caught it: MockMvc tests call the controller directly, and the
 * frontend tests mock fetch, so neither goes through a browser's preflight.
 * This test sends the preflight the browser sends.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("CORS preflight")
class CorsPreflightTest {

    private static final String ALLOWED_ORIGIN = "http://localhost:3000";

    @Autowired
    private MockMvc mockMvc;

    private ResultActions preflight(String origin, String method) throws Exception {
        return mockMvc.perform(options("/api/users/me/password")
                .header("Origin", origin)
                .header("Access-Control-Request-Method", method)
                .header("Access-Control-Request-Headers", "authorization,content-type"));
    }

    @ParameterizedTest(name = "{0}")
    @ValueSource(strings = {"GET", "POST", "PUT", "PATCH", "DELETE"})
    @DisplayName("allows every method the API uses")
    void allowsEveryMethodTheApiUses(String method) throws Exception {
        preflight(ALLOWED_ORIGIN, method)
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", ALLOWED_ORIGIN))
                .andExpect(header().string("Access-Control-Allow-Methods", containsString(method)));
    }

    @Test
    @DisplayName("still refuses an origin that is not on the list")
    void refusesUnknownOrigins() throws Exception {
        preflight("https://not-our-site.example", "PATCH").andExpect(status().isForbidden());
    }
}
