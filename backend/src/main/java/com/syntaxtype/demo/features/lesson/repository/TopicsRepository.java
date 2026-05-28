package com.syntaxtype.demo.features.lesson.repository;

import com.syntaxtype.demo.features.lesson.entity.Topics;
import com.syntaxtype.demo.features.user.entity.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface TopicsRepository extends JpaRepository<Topics, Long> {
    List<Topics> findByName(String name);
    List<Topics> findByDescription(String description);
    List<Topics> findByCreatedBy(Teacher createdBy);
}
