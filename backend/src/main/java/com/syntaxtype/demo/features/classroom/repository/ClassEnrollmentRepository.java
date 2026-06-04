package com.syntaxtype.demo.features.classroom.repository;

import com.syntaxtype.demo.features.classroom.entity.ClassEnrollment;
import com.syntaxtype.demo.features.classroom.entity.Classroom;
import com.syntaxtype.demo.features.user.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClassEnrollmentRepository extends JpaRepository<ClassEnrollment, Long> {
    List<ClassEnrollment> findByClassroom(Classroom classroom);
    List<ClassEnrollment> findByStudent(Student student);
    boolean existsByClassroomAndStudent(Classroom classroom, Student student);
    long countByClassroom(Classroom classroom);
    Optional<ClassEnrollment> findByClassroom_ClassroomIdAndStudent_StudentId(Long classroomId, Long studentId);
}
