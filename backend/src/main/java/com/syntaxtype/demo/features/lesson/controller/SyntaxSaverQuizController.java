package com.syntaxtype.demo.features.lesson.controller;

import com.syntaxtype.demo.features.lesson.dto.SyntaxSaverQuizDTO;
import com.syntaxtype.demo.features.lesson.dto.SyntaxSaverValidateRequest;
import com.syntaxtype.demo.features.lesson.service.SyntaxSaverQuizService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Syntax Saver Quiz REST endpoints (SDD §3.1.3, OI-04 remediation).
 *
 * GET endpoints return the student-facing view (no correctAnswer field).
 * /teacher endpoints include correctAnswer for authoring.
 * POST /{id}/validate is the server-side validation path — students never
 * receive correctAnswer in any response.
 */
@RestController
@RequestMapping("/api/syntax-saver")
public class SyntaxSaverQuizController {

    private final SyntaxSaverQuizService service;

    public SyntaxSaverQuizController(SyntaxSaverQuizService service) {
        this.service = service;
    }

    @GetMapping
    public List<SyntaxSaverQuizDTO> list() {
        return service.findAllForStudent();
    }

    @GetMapping("/{id}")
    public SyntaxSaverQuizDTO get(@PathVariable Long id) {
        return service.findByIdForStudent(id);
    }

    @GetMapping("/teacher")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public List<SyntaxSaverQuizDTO> listForTeacher() {
        return service.findAllForTeacher();
    }

    @GetMapping("/teacher/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public SyntaxSaverQuizDTO getForTeacher(@PathVariable Long id) {
        return service.findByIdForTeacher(id);
    }

    @PostMapping("/{id}/validate")
    public Map<String, Object> validate(@PathVariable Long id, @RequestBody SyntaxSaverValidateRequest req) {
        boolean correct;
        if (req.getOrder() != null && !req.getOrder().isEmpty()) {
            correct = service.validateReorderAnswer(id, req.getStepId(), req.getOrder());
        } else {
            correct = service.validateMatchAnswer(id, req.getStepId(), req.getAnswer());
        }
        return Map.of("correct", correct);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public SyntaxSaverQuizDTO create(@RequestBody SyntaxSaverQuizDTO dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public SyntaxSaverQuizDTO update(@PathVariable Long id, @RequestBody SyntaxSaverQuizDTO dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
