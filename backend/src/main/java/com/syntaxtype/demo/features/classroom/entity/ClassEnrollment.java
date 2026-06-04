package com.syntaxtype.demo.features.classroom.entity;

import java.time.LocalDateTime;

import com.syntaxtype.demo.features.user.entity.Student;

import jakarta.persistence.*;

import lombok.*;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(
        name = "class_enrollments",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_class_enrollment_classroom_student",
                columnNames = {"classroom_id", "student_id"}
        )
)
public class ClassEnrollment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long enrollmentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_id")
    private Classroom classroom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private Student student;

    private LocalDateTime enrolledAt;

    @PrePersist
    protected void onCreate() {
        this.enrolledAt = LocalDateTime.now();
    }
}
