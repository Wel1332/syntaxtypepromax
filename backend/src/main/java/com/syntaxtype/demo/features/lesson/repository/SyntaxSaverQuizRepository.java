package com.syntaxtype.demo.features.lesson.repository;

import com.syntaxtype.demo.features.lesson.entity.SyntaxSaverQuiz;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SyntaxSaverQuizRepository extends JpaRepository<SyntaxSaverQuiz, Long> {
    boolean existsByTitle(String title);
}
