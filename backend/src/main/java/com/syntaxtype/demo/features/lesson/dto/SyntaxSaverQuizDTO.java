package com.syntaxtype.demo.features.lesson.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.syntaxtype.demo.features.lesson.entity.syntax.SyntaxSaverStepType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SyntaxSaverQuizDTO {
    private Long id;
    private String title;
    private String description;
    private List<StepDTO> steps = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StepDTO {
        private Long id;
        private Integer stepOrder;
        private SyntaxSaverStepType type;
        private String question;

        @JsonInclude(JsonInclude.Include.NON_NULL)
        private List<String> options;

        /**
         * Hidden from student-facing responses; surfaced only on the teacher
         * authoring endpoint. The service decides whether to populate it.
         */
        @JsonInclude(JsonInclude.Include.NON_NULL)
        private String correctAnswer;

        @JsonInclude(JsonInclude.Include.NON_NULL)
        private List<String> parts;
    }
}
