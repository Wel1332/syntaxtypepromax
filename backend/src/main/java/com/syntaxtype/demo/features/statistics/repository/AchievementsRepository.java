package com.syntaxtype.demo.features.statistics.repository;

import com.syntaxtype.demo.features.statistics.entity.Achievements;
import com.syntaxtype.demo.features.user.entity.Teacher;
import com.syntaxtype.demo.features.lesson.entity.Topics;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AchievementsRepository extends JpaRepository<Achievements, Long> {
    List<Achievements> findByName(String name);
    List<Achievements> findByDescription(String description);
    List<Achievements> findByCreatedBy(Teacher createdBy);
    List<Achievements> findByTopicId(Topics topicId);
    List<Achievements> findByCreatedAt(LocalDateTime createdAt);
    List<Achievements> findByTriggerType(String triggerType);
    List<Achievements> findByTriggerValue(Integer triggerValue);
}
