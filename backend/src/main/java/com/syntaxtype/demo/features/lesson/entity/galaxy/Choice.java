package com.syntaxtype.demo.features.lesson.entity.galaxy;

import org.springframework.beans.factory.annotation.Value;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Choice {
    @Column(name = "choice_text", nullable = false)
    private String choice;

    @Column(name = "is_correct", nullable = false)
    @Value("false")
    private boolean isCorrect;
}
