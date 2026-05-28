package com.syntaxtype.demo.features.lesson.service;


import com.syntaxtype.demo.features.lesson.entity.Quiz;
import com.syntaxtype.demo.features.lesson.repository.QuizRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class QuizService {

    private final QuizRepository quizRepo;

    public QuizService(QuizRepository quizRepo) {
        this.quizRepo = quizRepo;
    }

    public List<Quiz> getAll() {
        return quizRepo.findAll();
    }

    public Quiz getById(Long id) {
        return quizRepo.findById(id).orElse(null);
    }

    public Quiz save(Quiz quiz) {
        return quizRepo.save(quiz);
    }

    public void delete(Long id) {
        quizRepo.deleteById(id);
    }
}

