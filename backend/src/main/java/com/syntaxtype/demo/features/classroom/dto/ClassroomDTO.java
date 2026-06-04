package com.syntaxtype.demo.features.classroom.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassroomDTO {
    private Long classroomId;
    private String name;
    private String description;
    private String classCode;
    private Long createdById;
    private String createdByName;
    private long studentCount;
    private LocalDateTime createdAt;
}
