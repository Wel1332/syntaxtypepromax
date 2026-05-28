package com.syntaxtype.demo.features.lesson.controller;



import com.syntaxtype.demo.features.lesson.dto.GalaxyChallengeDTO;
import com.syntaxtype.demo.features.lesson.dto.GalaxyChallengePreview;
import com.syntaxtype.demo.features.lesson.dto.GalaxyValidateRequest;
import com.syntaxtype.demo.features.lesson.service.GalaxyChallengeService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/api/challenges/galaxy")
public class GalaxyChallengeController {

    private final GalaxyChallengeService service;

    public GalaxyChallengeController(GalaxyChallengeService service) {
        this.service = service;
    }

    @GetMapping
    public List<GalaxyChallengePreview> getAllChallenge() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public GalaxyChallengeDTO getChallenge(@PathVariable Long id) {
        return service.findByIdNoAnswer(id);
    }

    /**
     * Server-side answer validation. Accepts the student's answer in the request body
     * and returns only a boolean result + corrective feedback — never the raw isCorrect
     * flag on Choice objects. Replaces the deprecated GET /checkCorrect endpoint, which
     * placed the answer in the query string (visible in access logs).
     */
    @PostMapping("/{id}/validate")
    public Map<String, Object> validate(@PathVariable Long id, @RequestBody GalaxyValidateRequest req) {
        boolean correct = service.checkifChoiceIsCorrect(id, req.getQuestionId(), req.getAnswer());
        return Map.of("correct", correct);
    }

    /**
     * @deprecated Use POST /{id}/validate instead. Kept for backward compatibility.
     */
    @Deprecated
    @GetMapping("/{id}/{questionId}/checkCorrect")
    public boolean checkAnswer(@PathVariable Long id, @PathVariable Long questionId, @RequestParam String selectedChoice) {
        return service.checkifChoiceIsCorrect(id, questionId, selectedChoice);
    }


    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public boolean create(@RequestBody GalaxyChallengeDTO challenge) {
        return service.createGalaxyChallenge(challenge);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public boolean update(@PathVariable Long id, @RequestBody GalaxyChallengeDTO challenge) {
        return service.updateGalaxyChallenge(id, challenge);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
