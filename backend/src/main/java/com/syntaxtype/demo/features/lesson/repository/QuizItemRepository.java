package com.syntaxtype.demo.features.lesson.repository;


import com.syntaxtype.demo.features.lesson.entity.QuizItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizItemRepository extends JpaRepository<QuizItem, Long> {
    List<QuizItem> findByQuizId(Long quizId);
}
