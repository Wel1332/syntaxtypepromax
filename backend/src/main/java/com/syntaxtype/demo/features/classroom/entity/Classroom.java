package com.syntaxtype.demo.features.classroom.entity;

import lombok.*;

import org.springframework.lang.NonNull;

import java.time.LocalDateTime;

import com.syntaxtype.demo.features.user.entity.Teacher;

import jakarta.persistence.*;


@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "classrooms")
@Builder
public class Classroom {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long classroomId;

    @NonNull
    private String name;

    private String description;

    @NonNull
    @Column(unique = true)
    private String classCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id")
    private Teacher createdBy;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
