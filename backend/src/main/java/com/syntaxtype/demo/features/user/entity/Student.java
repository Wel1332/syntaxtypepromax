package com.syntaxtype.demo.features.user.entity;

import lombok.*;

import org.springframework.lang.NonNull;

import jakarta.persistence.*;


@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "students")
@Builder
public class Student {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long studentId;

    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @MapsId
    @JoinColumn(name = "user_id", referencedColumnName = "userId")
    private User user;

    @NonNull
    private String firstName;

    @NonNull
    private String lastName;

    @NonNull
    private String universityEmail;

    @NonNull
    private String course;

    @NonNull
    private String yearLevel;

    @NonNull
    private String className;

    @NonNull
    private String section;
}