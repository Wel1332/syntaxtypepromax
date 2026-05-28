package com.syntaxtype.demo.features.lesson.service;

import com.syntaxtype.demo.features.lesson.dto.LessonsDTO;
import com.syntaxtype.demo.features.lesson.entity.Lessons;
import com.syntaxtype.demo.features.lesson.repository.LessonsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class LessonsService {

    private final LessonsRepository lessonsRepository;

    // Get all lessons as DTOs
    public List<LessonsDTO> findAll() {
        return lessonsRepository.findAll().stream()
                .map(this::convertToDTO)
                .toList();
    }

    // Find a lesson by its ID
    public Optional<LessonsDTO> findByLessonId(Long lessonId) {
        return lessonsRepository.findById(lessonId)
                .map(this::convertToDTO);
    }

    // Find all lessons by title
    public List<LessonsDTO> findByTitle(String title) {
        return lessonsRepository.findByTitle(title).stream()
                .map(this::convertToDTO)
                .toList();
    }

    // Save a new lesson from DTO
    public LessonsDTO save(LessonsDTO lessonsDTO) {
        Lessons lessons = convertFromDTO(lessonsDTO);
        Lessons saved = lessonsRepository.save(lessons);
        return convertToDTO(saved);
    }

    // Update title only
    public LessonsDTO updateTitle(Long lessonId, String newTitle) {
        return lessonsRepository.findById(lessonId)
                .map(lesson -> {
                    lesson.setTitle(newTitle);
                    return convertToDTO(lessonsRepository.save(lesson));
                })
                .orElse(null);
    }

    // ✅ Update full lesson (title + content) using DTO
    public LessonsDTO updateLesson(Long lessonId, LessonsDTO updatedDTO) {
        return lessonsRepository.findById(lessonId)
                .map(existingLesson -> {
                    existingLesson.setTitle(updatedDTO.getTitle());
                    existingLesson.setContent(updatedDTO.getContent());
                    return convertToDTO(lessonsRepository.save(existingLesson));
                })
                .orElse(null); // or throw exception if preferred
    }

    // Delete lesson by ID
    public void deleteById(Long id) {
        lessonsRepository.deleteById(id);
    }

    // ✅ Convert entity to DTO (now includes lessonId)
    public LessonsDTO convertToDTO(Lessons lessons) {
        if (lessons == null) return null;

        return LessonsDTO.builder()
                .lessonId(lessons.getLessonId())
                .title(lessons.getTitle())
                .content(lessons.getContent())
                .build();
    }

    // ✅ Convert DTO to entity (now includes lessonId)
    public Lessons convertFromDTO(LessonsDTO dto) {
        if (dto == null) return null;

        return Lessons.builder()
                .lessonId(dto.getLessonId()) // include if updating existing lesson
                .title(dto.getTitle())
                .content(dto.getContent())
                .build();
    }
}
