package com.syntaxtype.demo.features.classroom.repository;

import com.syntaxtype.demo.features.classroom.entity.Classroom;
import com.syntaxtype.demo.features.user.entity.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClassroomRepository extends JpaRepository<Classroom, Long> {
    Optional<Classroom> findByClassCode(String classCode);
    boolean existsByClassCode(String classCode);
    List<Classroom> findByCreatedBy(Teacher createdBy);
}
