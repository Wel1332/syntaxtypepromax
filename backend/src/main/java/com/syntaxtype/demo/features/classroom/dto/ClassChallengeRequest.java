package com.syntaxtype.demo.features.classroom.dto;

import com.syntaxtype.demo.core.enums.ContentGame;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class ClassChallengeRequest {
    private ContentGame game;
    private String title;
    private String instructions;
    // Shape depends on the game; ClassChallengeItems validates and cleans it.
    private List<Map<String, Object>> items;
    // Null or absent means unlimited.
    private Integer maxAttempts;
    // Absent on create means hidden.
    private Boolean visible;
}
