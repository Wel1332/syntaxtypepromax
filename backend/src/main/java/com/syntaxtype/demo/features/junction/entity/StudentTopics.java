package com.syntaxtype.demo.features.junction.entity;

import java.io.Serializable;

import com.syntaxtype.demo.features.junction.entity.compositekeys.StudentTopicsId;
import com.syntaxtype.demo.features.lesson.entity.Topics;
import com.syntaxtype.demo.features.user.entity.Student;

import jakarta.persistence.*;

import lombok.*;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "student_topics")
@Builder
public class StudentTopics implements Serializable{
    @EmbeddedId
    @Id
    private StudentTopicsId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("student")
    @JoinColumn(name = "student_id")
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("topic")
    @JoinColumn(name = "topic_id")
    private Topics topic;
}