package com.syntaxtype.demo.features.lesson.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SyntaxSaverValidateRequest {
    private Long stepId;
    /** For MATCH steps: the chosen option text. */
    private String answer;
    /** For REORDER steps: the submitted order of parts. */
    private List<String> order;
}
