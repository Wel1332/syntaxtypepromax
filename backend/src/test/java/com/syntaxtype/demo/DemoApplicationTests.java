package com.syntaxtype.demo;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * @ActiveProfiles("test") is load-bearing, not decoration. Without it this class
 * boots the full application against the production Supabase database and runs
 * the admin-bootstrap routine there. See src/test/resources/application-test.properties.
 */
@SpringBootTest
@ActiveProfiles("test")
class DemoApplicationTests {

	@Test
	void contextLoads() {
	}

}
