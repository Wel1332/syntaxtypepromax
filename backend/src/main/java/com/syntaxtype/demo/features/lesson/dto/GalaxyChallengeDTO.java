package com.syntaxtype.demo.features.lesson.dto;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.syntaxtype.demo.features.lesson.entity.galaxy.QuestionTypes;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GalaxyChallengeDTO {
    private Long id;
    private String title;
    private String description;
    private List<QuestionDTO> questions = new ArrayList<>();


    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionDTO {
        private Long id;
        private String question;
        private QuestionTypes type;
        private List<ChoiceDTO> choices = new ArrayList<>();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChoiceDTO {
        private String choice;

        @JsonInclude(JsonInclude.Include.NON_NULL)
        private Boolean isCorrect;
    }
}