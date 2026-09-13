package com.syntaxtype.demo.core.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Configuration;

/**
 * Turns on Spring's caching proxies.
 *
 * <p>Without this, the {@code @Cacheable} annotations on
 * {@code LeaderboardController} are inert — Spring only intercepts the method
 * when caching is enabled, so every leaderboard request reached the database
 * while the annotations suggested it was already being cached. That mattered
 * because the global leaderboard is the busiest read on the app: it backs the
 * public landing page, the in-app leaderboard, and the deploy health check.
 *
 * <p>The cache itself is Caffeine, configured by {@code spring.cache.caffeine.spec}
 * in application.properties. The TTL there is deliberately short, and
 * {@code LeaderboardService.updateLeaderboardIfBetter} evicts on write, so a
 * student who beats their own score does not keep seeing the old board.
 */
@Configuration
@EnableCaching
public class CacheConfig {
}
