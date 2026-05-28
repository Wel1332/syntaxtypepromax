package com.syntaxtype.demo.features.junction.repository;

import com.syntaxtype.demo.features.junction.entity.compositekeys.StudentTopicsId;
import com.syntaxtype.demo.features.junction.entity.StudentTopics;
import com.syntaxtype.demo.features.user.entity.Student;
import com.syntaxtype.demo.features.lesson.entity.Topics;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StudentTopicsRepository extends JpaRepository<StudentTopics, StudentTopicsId> {
    List<StudentTopics> findByStudent(Student student);
    List<StudentTopics> findByTopic(Topics topic);
    boolean existsByStudentAndTopic(Student student, Topics topic);
}
