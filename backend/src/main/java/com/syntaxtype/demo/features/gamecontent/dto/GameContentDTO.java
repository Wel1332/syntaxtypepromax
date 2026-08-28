package com.syntaxtype.demo.features.gamecontent.dto;

import com.syntaxtype.demo.core.enums.ContentBank;
import com.syntaxtype.demo.core.enums.ContentGame;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameContentDTO {
    private Long contentId;
    private ContentGame game;
    private ContentBank bank;
    private String itemType;
    private String externalId;
    private String topic;
    private String difficulty;
    private String payload;
    private Boolean active;
    private Integer position;
    private LocalDateTime updatedAt;
}
