package com.syntaxtype.demo.core.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The datasource URL must come from DB_URL, with no fallback.
 *
 * It used to default to the production Supabase host. Combined with the local,
 * gitignored secret.properties that supplies DB_PASSWORD, that meant any local
 * run of the app (spring-boot:run, java -jar, an IDE "Run") connected straight
 * to the production database, where the study's research data lives. Without a
 * default, a run with no DB_URL fails at startup instead. Render sets DB_URL in
 * render.yaml, so production is unaffected.
 *
 * Reads the file as plain properties rather than booting Spring, so the check
 * cannot itself open a connection.
 */
@DisplayName("Database URL default")
class DatabaseUrlDefaultTest {

    @Test
    @DisplayName("has no fallback, so a run without DB_URL cannot reach a real database")
    void datasourceUrlHasNoDefault() throws Exception {
        Properties props = new Properties();
        try (InputStream in = getClass().getResourceAsStream("/application.properties")) {
            assertThat(in).as("application.properties on the classpath").isNotNull();
            props.load(in);
        }

        assertThat(props.getProperty("spring.datasource.url")).isEqualTo("${DB_URL}");
    }
}
