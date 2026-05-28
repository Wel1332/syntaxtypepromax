package com.syntaxtype.demo.features.lesson.entity.syntax;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "syntax_saver_step")
public class SyntaxSaverStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "step_order", nullable = false)
    private Integer stepOrder;

    @Enumerated(EnumType.STRING)
    @Column(name = "step_type", nullable = false)
    private SyntaxSaverStepType type;

    @Column(name = "question_text", nullable = false, length = 600)
    private String question;

    /** MATCH-only: list of options the student picks from. */
    @ElementCollection
    @CollectionTable(
            name = "syntax_saver_step_options",
            joinColumns = @JoinColumn(name = "step_id")
    )
    @Column(name = "option_text")
    private List<String> options = new ArrayList<>();

    /** MATCH-only: the correct option. */
    @Column(name = "correct_answer")
    private String correctAnswer;

    /** REORDER-only: ordered list of code parts in their CORRECT order. */
    @ElementCollection
    @CollectionTable(
            name = "syntax_saver_step_parts",
            joinColumns = @JoinColumn(name = "step_id")
    )
    @OrderColumn(name = "part_index")
    @Column(name = "part_text", length = 400)
    private List<String> parts = new ArrayList<>();
}
