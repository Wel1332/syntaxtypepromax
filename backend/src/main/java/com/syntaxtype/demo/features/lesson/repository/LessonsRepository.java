package com.syntaxtype.demo.features.lesson.repository;

import com.syntaxtype.demo.features.lesson.entity.Lessons;
import com.syntaxtype.demo.features.lesson.entity.Topics;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LessonsRepository extends JpaRepository<Lessons, Long> {

    List<Lessons> findByTitle(String title);
}
