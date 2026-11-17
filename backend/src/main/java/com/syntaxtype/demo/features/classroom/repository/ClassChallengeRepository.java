package com.syntaxtype.demo.features.classroom.repository;

import com.syntaxtype.demo.features.classroom.entity.ClassChallenge;
import com.syntaxtype.demo.features.classroom.entity.Classroom;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ClassChallengeRepository extends JpaRepository<ClassChallenge, Long> {

    List<ClassChallenge> findByClassroomOrderByCreatedAtDesc(Classroom classroom);

    List<ClassChallenge> findByClassroomInAndVisibleTrueOrderByCreatedAtDesc(Collection<Classroom> classrooms);

    // Locks the row so two attempts submitted at once can't both pass the limit check.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from ClassChallenge c where c.challengeId = :id")
    Optional<ClassChallenge> findByIdForUpdate(@Param("id") Long id);
}
