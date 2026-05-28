package com.syntaxtype.demo.features.lesson.service;

import com.syntaxtype.demo.features.lesson.dto.SyntaxSaverQuizDTO;
import com.syntaxtype.demo.features.lesson.entity.SyntaxSaverQuiz;
import com.syntaxtype.demo.features.lesson.entity.syntax.SyntaxSaverStep;
import com.syntaxtype.demo.features.lesson.entity.syntax.SyntaxSaverStepType;
import com.syntaxtype.demo.features.lesson.repository.SyntaxSaverQuizRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SyntaxSaverQuizService {

    private final SyntaxSaverQuizRepository repository;

    public SyntaxSaverQuizService(SyntaxSaverQuizRepository repository) {
        this.repository = repository;
    }

    public List<SyntaxSaverQuizDTO> findAllForStudent() {
        return repository.findAll().stream()
                .map(q -> toDTO(q, false))
                .collect(Collectors.toList());
    }

    public List<SyntaxSaverQuizDTO> findAllForTeacher() {
        return repository.findAll().stream()
                .map(q -> toDTO(q, true))
                .collect(Collectors.toList());
    }

    public SyntaxSaverQuizDTO findByIdForStudent(Long id) {
        return toDTO(getOrThrow(id), false);
    }

    public SyntaxSaverQuizDTO findByIdForTeacher(Long id) {
        return toDTO(getOrThrow(id), true);
    }

    /** Server-side answer validation. Returns true iff studentAnswer matches the step's correct answer. */
    public boolean validateMatchAnswer(Long quizId, Long stepId, String studentAnswer) {
        SyntaxSaverQuiz quiz = getOrThrow(quizId);
        return quiz.getSteps().stream()
                .filter(s -> s.getId().equals(stepId) && s.getType() == SyntaxSaverStepType.MATCH)
                .findFirst()
                .map(s -> normalize(s.getCorrectAnswer()).equals(normalize(studentAnswer)))
                .orElse(false);
    }

    /** Server-side reorder validation. Returns true iff submittedOrder equals the stored canonical parts. */
    public boolean validateReorderAnswer(Long quizId, Long stepId, List<String> submittedOrder) {
        SyntaxSaverQuiz quiz = getOrThrow(quizId);
        return quiz.getSteps().stream()
                .filter(s -> s.getId().equals(stepId) && s.getType() == SyntaxSaverStepType.REORDER)
                .findFirst()
                .map(s -> s.getParts().equals(submittedOrder))
                .orElse(false);
    }

    public SyntaxSaverQuizDTO create(SyntaxSaverQuizDTO dto) {
        SyntaxSaverQuiz quiz = new SyntaxSaverQuiz();
        quiz.setTitle(dto.getTitle());
        quiz.setDescription(dto.getDescription());
        quiz.setSteps(mapStepsFromDTO(dto.getSteps()));
        return toDTO(repository.save(quiz), true);
    }

    public SyntaxSaverQuizDTO update(Long id, SyntaxSaverQuizDTO dto) {
        SyntaxSaverQuiz quiz = getOrThrow(id);
        quiz.setTitle(dto.getTitle());
        quiz.setDescription(dto.getDescription());
        quiz.getSteps().clear();
        quiz.getSteps().addAll(mapStepsFromDTO(dto.getSteps()));
        return toDTO(repository.save(quiz), true);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public boolean existsByTitle(String title) {
        return repository.existsByTitle(title);
    }

    public SyntaxSaverQuiz saveRaw(SyntaxSaverQuiz quiz) {
        return repository.save(quiz);
    }

    private SyntaxSaverQuiz getOrThrow(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Syntax Saver quiz not found: " + id));
    }

    private SyntaxSaverQuizDTO toDTO(SyntaxSaverQuiz quiz, boolean includeAnswers) {
        SyntaxSaverQuizDTO dto = new SyntaxSaverQuizDTO();
        dto.setId(quiz.getId());
        dto.setTitle(quiz.getTitle());
        dto.setDescription(quiz.getDescription());
        dto.setSteps(quiz.getSteps().stream()
                .map(s -> stepToDTO(s, includeAnswers))
                .collect(Collectors.toList()));
        return dto;
    }

    private SyntaxSaverQuizDTO.StepDTO stepToDTO(SyntaxSaverStep step, boolean includeAnswers) {
        SyntaxSaverQuizDTO.StepDTO sdto = new SyntaxSaverQuizDTO.StepDTO();
        sdto.setId(step.getId());
        sdto.setStepOrder(step.getStepOrder());
        sdto.setType(step.getType());
        sdto.setQuestion(step.getQuestion());

        if (step.getType() == SyntaxSaverStepType.MATCH) {
            sdto.setOptions(new ArrayList<>(step.getOptions()));
            if (includeAnswers) sdto.setCorrectAnswer(step.getCorrectAnswer());
        } else if (step.getType() == SyntaxSaverStepType.REORDER) {
            // For students we still need to render the parts (shuffled client-side),
            // so parts must be sent. The order itself IS the answer; validation happens server-side.
            sdto.setParts(new ArrayList<>(step.getParts()));
        }
        return sdto;
    }

    private List<SyntaxSaverStep> mapStepsFromDTO(List<SyntaxSaverQuizDTO.StepDTO> stepDTOs) {
        if (stepDTOs == null) return new ArrayList<>();
        List<SyntaxSaverStep> out = new ArrayList<>();
        int autoOrder = 0;
        for (SyntaxSaverQuizDTO.StepDTO sdto : stepDTOs) {
            SyntaxSaverStep step = new SyntaxSaverStep();
            step.setStepOrder(sdto.getStepOrder() != null ? sdto.getStepOrder() : autoOrder);
            step.setType(sdto.getType());
            step.setQuestion(sdto.getQuestion());
            if (sdto.getType() == SyntaxSaverStepType.MATCH) {
                step.setOptions(sdto.getOptions() != null ? new ArrayList<>(sdto.getOptions()) : new ArrayList<>());
                step.setCorrectAnswer(sdto.getCorrectAnswer());
            } else if (sdto.getType() == SyntaxSaverStepType.REORDER) {
                step.setParts(sdto.getParts() != null ? new ArrayList<>(sdto.getParts()) : new ArrayList<>());
            }
            out.add(step);
            autoOrder++;
        }
        return out;
    }

    private static String normalize(String s) {
        return s == null ? "" : s.trim().toLowerCase();
    }
}
