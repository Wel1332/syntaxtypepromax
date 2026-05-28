package com.syntaxtype.demo.features.lesson.controller;

import com.syntaxtype.demo.features.lesson.dto.ChallengeDTO;
import com.syntaxtype.demo.core.enums.ChallengeType;
import com.syntaxtype.demo.features.lesson.entity.Challenge;
import com.syntaxtype.demo.features.lesson.service.ChallengeService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/challenges")
public class ChallengeController {

    private final ChallengeService service;

    public ChallengeController(ChallengeService service) {
        this.service = service;
    }

    // Create a normal challenge (Paragraph)
    @PostMapping
    public Challenge createNormalChallenge(@RequestBody Challenge challenge) {
        challenge.setType(ChallengeType.PARAGRAPH);  // Ensure the challenge is of type 'PARAGRAPH'
        return service.save(challenge);
    }

    // Create a falling challenge (List of words)
    @PostMapping("/falling")
    public ResponseEntity<Challenge> createFallingChallenge(@RequestBody Challenge challenge) {
        if (challenge.getWords() == null || challenge.getWords().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        challenge.setType(ChallengeType.FALLING_TYPING_TEST);

        // Ensure default values if not set
        if (challenge.getSpeed() == null || challenge.getSpeed() == 0) {
            challenge.setSpeed(1); // default 1
        }

        if (challenge.getMaxLives() == null || challenge.getMaxLives() == 0) {
            challenge.setMaxLives(3); // default 3
        }
        if (challenge.getWrongWords() == null) {
            challenge.setWrongWords(new ArrayList<>()); // Default to empty list
        }

        Challenge saved = service.save(challenge);
        return ResponseEntity.ok(saved);
    }

    // Get all normal challenges (Paragraph)
    @GetMapping
    public List<Challenge> getAllNormalChallenges() {
        return service.getAllNormalChallenges(); // Fetching all normal typing challenges
    }

    @GetMapping("/normal/{id}")
    public ResponseEntity<Challenge> getNormalChallengeById(@PathVariable Long id) {
        Challenge challenge = service.getNormalChallengeById(id);
        if (challenge != null) {
            return ResponseEntity.ok(challenge);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // Get all falling challenges
    @GetMapping("/falling")
    public List<Challenge> getAllFallingChallenges() {
        return service.getAllFallingChallenges(); // Fetching all falling typing challenges
    }

    @GetMapping("/falling/{id}")
    public ResponseEntity<Challenge> getFallingChallengeById(@PathVariable Long id) {
        Challenge challenge = service.getFallingChallengeById(id);
        if (challenge != null) {
            return ResponseEntity.ok(challenge);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Challenge> getChallengeById(@PathVariable Long id) {
        Challenge challenge = service.findById(id);
        if (challenge != null) {
            return ResponseEntity.ok(challenge);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // Delete a challenge by ID
    @DeleteMapping("/{id}")
    public void deleteChallenge(@PathVariable Long id) {
        service.deleteById(id);
    }

    @DeleteMapping("/falling/{id}")
    public ResponseEntity<Void> deleteFallingChallenge(@PathVariable Long id) {
        Challenge challenge = service.findById(id);
        if (challenge != null && challenge.getType() == ChallengeType.FALLING_TYPING_TEST) {
            service.deleteById(id);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // Edit a challenge by ID
    @PutMapping("/{id}")
    public ResponseEntity<Challenge> editChallenge(@PathVariable Long id, @RequestBody Challenge challenge) {
        Challenge existingChallenge = service.findById(id);
        if (existingChallenge != null) {
            existingChallenge.setParagraph(challenge.getParagraph());
            existingChallenge.setWords(challenge.getWords());
            existingChallenge.setType(challenge.getType());


            // Optional fields only for Falling Typing Test
            if (challenge.getType() == ChallengeType.FALLING_TYPING_TEST) {
                existingChallenge.setTestTimer(challenge.getTestTimer());
                existingChallenge.setSpeed(challenge.getSpeed());
                existingChallenge.setMaxLives(challenge.getMaxLives());
            }

            Challenge updated = service.save(existingChallenge);
            return ResponseEntity.ok(updated);
        } else {
            return ResponseEntity.notFound().build();
        }
    } @PostMapping("/falling/advanced")
    public ResponseEntity<ChallengeDTO> createAdvancedFallingChallenge(@RequestBody Challenge challenge) {
        // Optionally you can still set the type here or leave it as is
        challenge.setType(null); // or remove this line if you want to keep type

        Challenge saved = service.save(challenge);

        ChallengeDTO dto = new ChallengeDTO();
        dto.setChallengeId(saved.getChallengeId());
        dto.setType(saved.getType());
        dto.setParagraph(saved.getParagraph());
        dto.setWords(saved.getWords());
        dto.setTestTimer(saved.getTestTimer());
        dto.setSpeed(saved.getSpeed());
        dto.setMaxLives(saved.getMaxLives());
        dto.setUseLives(saved.getUseLives());
        dto.setWrongWords(saved.getWrongWords());

        return ResponseEntity.ok(dto);
    }

    @GetMapping("/falling/advanced")
    public List<Challenge> getAllAdvancedFallingChallenges() {
        return service.getAllAdvancedFallingChallenges();
    }

    @GetMapping("/falling/advanced/{id}")
    public ResponseEntity<Challenge> getAdvancedFallingChallengeById(@PathVariable Long id) {
        Challenge challenge = service.getAdvancedFallingChallengeById(id);
        if (challenge != null) {
            return ResponseEntity.ok(challenge);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/falling/advanced/{id}")
    public ResponseEntity<Challenge> editAdvancedFallingChallenge(@PathVariable Long id, @RequestBody Challenge challenge) {
        Challenge existingChallenge = service.getAdvancedFallingChallengeById(id);
        if (existingChallenge != null) {
            existingChallenge.setParagraph(challenge.getParagraph());
            existingChallenge.setWords(challenge.getWords());
            existingChallenge.setTestTimer(challenge.getTestTimer());
            existingChallenge.setSpeed(challenge.getSpeed());
            existingChallenge.setMaxLives(challenge.getMaxLives());
            existingChallenge.setWrongWords(challenge.getWrongWords());
            existingChallenge.setUseLives(challenge.getUseLives());
            existingChallenge.setType(challenge.getType()); // Optional

            Challenge updated = service.save(existingChallenge);
            return ResponseEntity.ok(updated);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/falling/advanced/{id}")
    public ResponseEntity<Void> deleteAdvancedFallingChallenge(@PathVariable Long id) {
        Challenge challenge = service.getAdvancedFallingChallengeById(id);
        if (challenge != null) {
            service.deleteById(id);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}