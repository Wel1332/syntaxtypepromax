package com.syntaxtype.demo.features.user.entity;

import lombok.*;

import jakarta.persistence.*;


@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "admins")
@Builder
public class Admin {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long adminId;

    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @MapsId
    @JoinColumn(name = "user_id", referencedColumnName = "userId")
    private User user;

    @NonNull
    private String firstName;

    @NonNull
    private String lastName;
}