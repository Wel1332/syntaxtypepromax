package com.syntaxtype.demo.features.lesson.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.bind.DefaultValue;

import com.syntaxtype.demo.features.lesson.entity.galaxy.Question;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "galaxy_challenge")
public class GalaxyChallenge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    @Value("Unnamed")
    private String title;

    @Column(length = 600)
    private String description = "No description...";

    // Store words in a dedicated table
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "galaxy_challenge_id", nullable = false)
    private List<Question> questions = new ArrayList<>();
}
