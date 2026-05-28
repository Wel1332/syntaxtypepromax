package com.syntaxtype.demo.features.statistics.entity;

import com.syntaxtype.demo.core.enums.Category;
import com.syntaxtype.demo.features.user.entity.User;

import jakarta.persistence.*;

import lombok.*;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "leaderboards", indexes = {
    @Index(name = "idx_category_wpm", columnList = "category, wordsPerMinute DESC"),
    @Index(name = "idx_category_accuracy", columnList = "category, accuracy DESC"),
    @Index(name = "idx_category", columnList = "category"),
    @Index(name = "idx_user", columnList = "user_id")
})
@Builder
public class Leaderboard {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long leaderboardId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    private Integer wordsPerMinute;
    private Integer accuracy;
    private Integer totalWordsTyped;
    private Integer totalTimeSpent;

    // Dedicated field for raw game scores (non-typing games like Memory, Snake, etc.)
    // NOTE: Schema migration may be needed - existing totalWordsTyped data for non-typing games may need to be migrated to this field
    private Integer score;

    @Enumerated(EnumType.STRING)
    @Column(name = "category")
    private Category category;
}