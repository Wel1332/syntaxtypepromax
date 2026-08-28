package com.syntaxtype.demo.features.gamecontent.entity;

import com.syntaxtype.demo.core.enums.ContentBank;
import com.syntaxtype.demo.core.enums.ContentGame;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * One authorable item of game content — a drill, a prompt, or an error template.
 *
 * Objective 4.2 asks faculty to be able to create, edit and delete this content.
 * Until now all three banks were static JavaScript compiled into the frontend
 * bundle, so changing a single drill meant a code change and a redeploy. No
 * faculty path existed at all.
 *
 * One table rather than three because the three banks share almost nothing
 * structurally: a Falling Code bug template is a {buggy, correct} pair, a Syntax
 * Sniper drill is a code block with blanks, and a Translation Terminal prompt is
 * English plus a canonical solution. Modelling each shape as its own table would
 * triple the CRUD surface for content that is always edited through the same
 * screen. The shape-specific fields live in `payload` as JSON text.
 *
 * `payload` is TEXT holding JSON rather than a native json/jsonb column so the
 * same mapping works against both Postgres in production and H2 under test,
 * without a Hibernate type contribution. The backend never interprets it; it is
 * the client's contract with itself.
 */
@Entity
@Table(
        name = "game_content",
        indexes = {
                @Index(name = "idx_game_content_game_bank", columnList = "game,bank,active")
        }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameContent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long contentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ContentGame game;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ContentBank bank;

    /**
     * Shape discriminator within a game — WORD, WRONG_WORD, CODE_LINE,
     * BUGGY_LINE, SEQUENCE, DRILL, PROMPT. Free text rather than an enum so a
     * new content shape does not require a backend release to author against.
     */
    @Column(nullable = false, length = 32)
    private String itemType;

    /**
     * The stable id the item carried in the original static bank (e.g. "T-14").
     * Kept so an import is idempotent and so a puzzle can still be identified in
     * analytics after it has been edited.
     */
    @Column(length = 64)
    private String externalId;

    /** Topic for prompts, error category for bug templates. Nullable. */
    @Column(length = 64)
    private String topic;

    @Column(length = 32)
    private String difficulty;

    @Lob
    @Column(columnDefinition = "text", nullable = false)
    private String payload;

    /**
     * Soft delete. Faculty removing a drill mid-study would otherwise silently
     * change what later participants are assessed on, with no record that the
     * item ever existed.
     */
    @Column(nullable = false)
    private boolean active;

    private Integer position;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
