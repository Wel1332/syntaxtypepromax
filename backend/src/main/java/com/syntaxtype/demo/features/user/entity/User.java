package com.syntaxtype.demo.features.user.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;

import java.time.LocalDateTime;

import org.springframework.lang.NonNull;

import com.syntaxtype.demo.core.enums.Role;

import jakarta.persistence.*;


@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "users")
@Builder

public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    @NonNull
    @Column(unique = true)
    private String username;

    @NonNull
    @Column(unique = true)
    private String email;

    @NonNull
    private String password;

    @NonNull
    @Enumerated(EnumType.STRING)
    @Column(name = "user_role")
    private Role userRole;

    @Column(name = "hasTemporaryPass")
    @Builder.Default
    private boolean isTempPassword = false;

    private LocalDateTime createdAt;

    // IMPORTANT: If you ever add fields here that represent the "other side"
    // of a bidirectional relationship (e.g., @OneToOne private Student student;),
    // you MUST also add @ToString.Exclude and @EqualsAndHashCode.Exclude to them.
    // Example:
    // @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    // @ToString.Exclude
    // @EqualsAndHashCode.Exclude
    // private Student student;

    // Method to automatically set createdAt before persisting
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.userRole == Role.TEACHER) {
            this.isTempPassword = true;
        }
    }
}