package com.syntaxtype.demo.features.classroom.repository;

import com.syntaxtype.demo.features.classroom.entity.ClassChallenge;
import com.syntaxtype.demo.features.classroom.entity.ClassChallengeAttempt;
import com.syntaxtype.demo.features.user.entity.Student;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface ClassChallengeAttemptRepository extends JpaRepository<ClassChallengeAttempt, Long> {

    long countByChallengeAndStudent(ClassChallenge challenge, Student student);

    @EntityGraph(attributePaths = {"student", "student.user"})
    List<ClassChallengeAttempt> findByChallengeOrderBySubmittedAtDescAttemptIdDesc(ClassChallenge challenge);

    @Modifying
    @Query("delete from ClassChallengeAttempt a where a.challenge in :challenges")
    void deleteByChallengeIn(@Param("challenges") Collection<ClassChallenge> challenges);
}
