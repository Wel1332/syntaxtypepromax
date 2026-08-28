package com.syntaxtype.demo.features.gamecontent.controller;

import com.syntaxtype.demo.core.enums.ContentBank;
import com.syntaxtype.demo.core.enums.ContentGame;
import com.syntaxtype.demo.features.gamecontent.dto.GameContentDTO;
import com.syntaxtype.demo.features.gamecontent.service.GameContentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Faculty CRUD over game content (Objective 4.2).
 *
 * Reads are open to any authenticated player because the games load their drills
 * through this endpoint. Every write is staff-only: content defines what
 * participants are assessed on, so a student able to edit it could rewrite their
 * own test.
 */
@RestController
@RequestMapping("/api/game-content")
@RequiredArgsConstructor
public class GameContentController {

    private final GameContentService service;

    /** What a game loads at the start of a session. Active items only. */
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @GetMapping
    public ResponseEntity<List<GameContentDTO>> forPlay(
            @RequestParam ContentGame game,
            @RequestParam ContentBank bank) {
        return ResponseEntity.ok(service.findForPlay(game, bank));
    }

    /** What the authoring screen lists — includes deactivated items. */
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping("/manage")
    public ResponseEntity<List<GameContentDTO>> forAuthoring(@RequestParam ContentGame game) {
        return ResponseEntity.ok(service.findForAuthoring(game));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @PostMapping
    public ResponseEntity<GameContentDTO> create(@RequestBody GameContentDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @PutMapping("/{contentId}")
    public ResponseEntity<GameContentDTO> update(
            @PathVariable Long contentId,
            @RequestBody GameContentDTO dto) {
        return ResponseEntity.ok(service.update(contentId, dto));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @DeleteMapping("/{contentId}")
    public ResponseEntity<Void> deactivate(@PathVariable Long contentId) {
        service.deactivate(contentId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Lift the built-in banks out of the frontend bundle into the database.
     * Idempotent on (game, bank, externalId); pass overwrite=true to replace
     * items that have since been edited.
     */
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @PostMapping("/import")
    public ResponseEntity<Map<String, Integer>> importBatch(
            @RequestBody List<GameContentDTO> items,
            @RequestParam(defaultValue = "false") boolean overwrite) {
        return ResponseEntity.ok(Map.of("written", service.importBatch(items, overwrite)));
    }

    /**
     * How many active items each bank holds. The games call this to decide
     * whether to use database content or fall back to their built-in bank, so it
     * is readable by any authenticated player.
     */
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT','USER')")
    @GetMapping("/counts")
    public ResponseEntity<Map<String, Long>> counts(@RequestParam ContentGame game) {
        return ResponseEntity.ok(Map.of(
                "PRACTICE", service.countActive(game, ContentBank.PRACTICE),
                "TEST", service.countActive(game, ContentBank.TEST)));
    }
}
