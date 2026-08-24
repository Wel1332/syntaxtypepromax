package com.syntaxtype.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Kept deliberately bare. Any {@code @Bean} declared here is loaded by every
 * slice test, because the {@code @SpringBootApplication} class is always the
 * primary configuration source. Start-up seeding lives in
 * {@link com.syntaxtype.demo.core.config.DataBootstrapConfig} instead.
 */
@SpringBootApplication
public class DemoApplication {

	public static void main(String[] args) {
		SpringApplication.run(DemoApplication.class, args);
	}
}
