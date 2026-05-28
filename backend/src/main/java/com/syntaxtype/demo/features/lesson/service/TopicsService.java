package com.syntaxtype.demo.features.lesson.service;

import com.syntaxtype.demo.features.lesson.dto.TopicsDTO;
import com.syntaxtype.demo.features.lesson.entity.Topics;
import com.syntaxtype.demo.features.user.entity.Teacher;
import com.syntaxtype.demo.features.lesson.repository.TopicsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TopicsService {
    private final TopicsRepository topicsRepository;

    public List<TopicsDTO> findAll() {
        return topicsRepository.findAll().stream()
                .map(this::convertToDTO)
                .toList();
    }

    public Optional<TopicsDTO> findByTopicId(Long topicId) {
        return topicsRepository.findById(topicId)
                .map(this::convertToDTO);
    }

    public List<TopicsDTO> findByName(String name) {
        return topicsRepository.findByName(name).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<TopicsDTO> findByDescription(String description) {
        return topicsRepository.findByDescription(description).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<TopicsDTO> findByCreatedBy(Teacher createdBy) {
        return topicsRepository.findByCreatedBy(createdBy).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public TopicsDTO save(TopicsDTO topicsDTO, Teacher createdBy) {
        Topics topics = convertFromDTO(topicsDTO, createdBy);
        return convertToDTO(topicsRepository.save(topics));
    }

    // PATCH: Update topic name
    public TopicsDTO updateName(Long topicId, String newName) {
        Optional<Topics> topicOpt = topicsRepository.findById(topicId);
        if (topicOpt.isPresent()) {
            Topics topic = topicOpt.get();
            topic.setName(newName);
            return convertToDTO(topicsRepository.save(topic));
        }
        return null;
    }

    // PATCH: Update topic description
    public TopicsDTO updateDescription(Long topicId, String newDescription) {
        Optional<Topics> topicOpt = topicsRepository.findById(topicId);
        if (topicOpt.isPresent()) {
            Topics topic = topicOpt.get();
            topic.setDescription(newDescription);
            return convertToDTO(topicsRepository.save(topic));
        }
        return null;
    }

    // PATCH: Update topic createdBy
    public TopicsDTO updateCreatedBy(Long topicId, Teacher newCreatedBy) {
        Optional<Topics> topicOpt = topicsRepository.findById(topicId);
        if (topicOpt.isPresent()) {
            Topics topic = topicOpt.get();
            topic.setCreatedBy(newCreatedBy);
            return convertToDTO(topicsRepository.save(topic));
        }
        return null;
    }

    public void deleteById(Long id) {
        topicsRepository.deleteById(id);
    }

    public TopicsDTO convertToDTO(Topics topics) {
        if (topics == null) return null;
        return TopicsDTO.builder()
                .topicId(topics.getTopicId())
                .name(topics.getName())
                .description(topics.getDescription())
                .createdById(topics.getCreatedBy() != null ? topics.getCreatedBy().getTeacherId() : null)
                .build();
    }

    public Topics convertFromDTO(TopicsDTO dto, Teacher createdBy) {
        if (dto == null) return null;
        Topics topics = new Topics();
        topics.setTopicId(dto.getTopicId());
        topics.setName(dto.getName());
        topics.setDescription(dto.getDescription());
        topics.setCreatedBy(createdBy);
        return topics;
    }
}
