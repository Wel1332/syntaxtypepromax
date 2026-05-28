package com.syntaxtype.demo.features.lesson.repository;



import com.syntaxtype.demo.features.lesson.entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuizRepository extends JpaRepository<Quiz, Long> {}
