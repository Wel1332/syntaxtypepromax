package com.syntaxtype.demo.core.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.lang.NonNull;

@Configuration
public class CorsConfig {

    @Value("${FRONTEND_URL:}")
    private String frontendUrl;

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(@NonNull CorsRegistry registry) {
                String[] defaultOrigins = new String[]{"http://localhost:5173", "http://localhost:8080", "http://localhost:3000", "https://syntaxtype-deploy-omega.vercel.app/"};
                if (frontendUrl != null && !frontendUrl.isEmpty()) {
                    String[] extras = frontendUrl.split(",");
                    String[] merged = java.util.Arrays.copyOf(defaultOrigins, defaultOrigins.length + extras.length);
                    for (int i = 0; i < extras.length; i++) {
                        merged[defaultOrigins.length + i] = extras[i].trim();
                    }
                    registry.addMapping("/**") // allow all paths
                            .allowedOrigins(merged)
                            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                            .allowedHeaders("*")
                            .allowCredentials(true);
                } else {
                    registry.addMapping("/**") // allow all paths
                            .allowedOrigins(defaultOrigins)
                            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                            .allowedHeaders("*")
                            .allowCredentials(true);
                }
            }
        };
    }
}
