package com.syntaxtype.demo.features.junction.repository;

import com.syntaxtype.demo.features.junction.entity.compositekeys.TeacherTopicsId;
import com.syntaxtype.demo.features.junction.entity.TeacherTopics;
import com.syntaxtype.demo.features.user.entity.Teacher;
import com.syntaxtype.demo.features.lesson.entity.Topics;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TeacherTopicsRepository extends JpaRepository<TeacherTopics, TeacherTopicsId> {
    List<TeacherTopics> findByTeacher(Teacher teacher);
    List<TeacherTopics> findByTopic(Topics topic);
    boolean existsByTeacherAndTopic(Teacher teacher, Topics topic);
}
