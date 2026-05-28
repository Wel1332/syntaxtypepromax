package com.syntaxtype.demo.features.user.repository;

import com.syntaxtype.demo.features.user.entity.Teacher;
import com.syntaxtype.demo.features.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface TeacherRepository extends JpaRepository<Teacher, Long> {
    Optional<Teacher> findByUser(User user);
    List<Teacher> findByFirstName(String firstName);
    List<Teacher> findByLastName(String lastName);
    List<Teacher> findByInstitution(String institution);
    List<Teacher> findBySubject(String subject);
    Optional<Teacher> findByUser_UserId(Long userId);
}
