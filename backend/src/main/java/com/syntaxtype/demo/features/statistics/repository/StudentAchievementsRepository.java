package com.syntaxtype.demo.features.statistics.repository;

import com.syntaxtype.demo.features.statistics.entity.StudentAchievements;
import com.syntaxtype.demo.features.user.entity.Student;
import com.syntaxtype.demo.features.statistics.entity.Achievements;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface StudentAchievementsRepository extends JpaRepository<StudentAchievements, Long> {
    List<StudentAchievements> findByStudent(Student student);
    List<StudentAchievements> findByAchievementId(Achievements achievementId);
    List<StudentAchievements> findByAwardedAt(LocalDateTime awardedAt);
}
