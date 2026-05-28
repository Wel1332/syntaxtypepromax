package com.syntaxtype.demo.features.user.repository;

import com.syntaxtype.demo.features.user.entity.Student;
import com.syntaxtype.demo.features.user.entity.User; // Import the User entity
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByUser_UserId(Long userId);
    Optional<Student> findByUser_Username(String username);
    Optional<Student> findByUser_Email(String email);
    List<Student> findByFirstName(String firstName);
    List<Student> findByLastName(String lastName);
    List<Student> findByUniversityEmail(String universityEmail);
    List<Student> findByCourse(String course);
    List<Student> findByYearLevel(String yearLevel);
    List<Student> findByClassName(String className);
    List<Student> findBySection(String section);

    // NEW: Add the findByUser method
    Optional<Student> findByUser(User user);

    // NEW: Derived delete query method to delete a student by their associated User's userId
    void deleteByUser_UserId(Long userId);
}
