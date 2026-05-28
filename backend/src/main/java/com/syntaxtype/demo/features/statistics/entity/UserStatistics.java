package com.syntaxtype.demo.features.statistics.entity;

import com.syntaxtype.demo.features.user.entity.User;

import jakarta.persistence.*;

import lombok.*;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "user_statistics")
@Builder
public class UserStatistics {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userStatisticsId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id", referencedColumnName = "userId")
    private User user;

    private Integer wordsPerMinute;
    private Integer accuracy;
    private Integer totalWordsTyped;
    private Integer totalTimeSpent;
    private Integer totalErrors;
    private Integer totalTestsTaken;
    private Integer fastestClearTime;
}