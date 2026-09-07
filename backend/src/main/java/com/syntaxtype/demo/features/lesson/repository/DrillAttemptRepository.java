package com.syntaxtype.demo.features.lesson.repository;

import com.syntaxtype.demo.features.lesson.entity.DrillAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DrillAttemptRepository extends JpaRepository<DrillAttempt, Long> {

    /**
     * Every drill attempt with its session and student eagerly fetched, oldest
     * session first, then in the order the drills were presented.
     *
     * The joins are explicit because the CSV export reads score and user on every
     * row; lazily loading them would issue two queries per drill, and a full
     * cohort is 30 students x 20 sessions x 6 drills.
     */
    @Query("select da from DrillAttempt da "
            + "join fetch da.score s "
            + "join fetch s.user "
            + "order by s.submittedAt asc, da.position asc")
    List<DrillAttempt> findAllWithSessionAndUser();
}
