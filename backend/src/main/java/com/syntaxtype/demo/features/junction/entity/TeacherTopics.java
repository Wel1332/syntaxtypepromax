package com.syntaxtype.demo.features.junction.entity;

import java.io.Serializable;

import com.syntaxtype.demo.features.junction.entity.compositekeys.TeacherTopicsId;
import com.syntaxtype.demo.features.lesson.entity.Topics;
import com.syntaxtype.demo.features.user.entity.Teacher;

import jakarta.persistence.*;

import lombok.*;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "teacher_topics")
@Builder
public class TeacherTopics implements Serializable{
    @EmbeddedId
    @Id
    private TeacherTopicsId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("teacher")
    @JoinColumn(name = "teacher_id")
    private Teacher teacher;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("topic")
    @JoinColumn(name = "topic_id")
    private Topics topic;
}