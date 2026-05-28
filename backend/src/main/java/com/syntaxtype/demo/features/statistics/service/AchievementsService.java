package com.syntaxtype.demo.features.statistics.service;

import com.syntaxtype.demo.features.statistics.dto.AchievementsDTO;
import com.syntaxtype.demo.features.statistics.entity.Achievements;
import com.syntaxtype.demo.features.user.entity.Teacher;
import com.syntaxtype.demo.features.lesson.entity.Topics;
import com.syntaxtype.demo.features.statistics.repository.AchievementsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AchievementsService {
    private final AchievementsRepository achievementsRepository;

    public List<AchievementsDTO> findAll() {
        return achievementsRepository.findAll().stream()
                .map(this::convertToDTO)
                .toList();
    }

    public Optional<AchievementsDTO> findByAchievementId(Long achievementId) {
        return achievementsRepository.findById(achievementId)
                .map(this::convertToDTO);
    }

    public List<AchievementsDTO> findByName(String name) {
        return achievementsRepository.findByName(name).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<AchievementsDTO> findByDescription(String description) {
        return achievementsRepository.findByDescription(description).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<AchievementsDTO> findByCreatedBy(Teacher createdBy) {
        return achievementsRepository.findByCreatedBy(createdBy).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<AchievementsDTO> findByTopicId(Topics topicId) {
        return achievementsRepository.findByTopicId(topicId).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<AchievementsDTO> findByCreatedAt(LocalDateTime createdAt) {
        return achievementsRepository.findByCreatedAt(createdAt).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<AchievementsDTO> findByTriggerType(String triggerType) {
        return achievementsRepository.findByTriggerType(triggerType).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<AchievementsDTO> findByTriggerValue(Integer triggerValue) {
        return achievementsRepository.findByTriggerValue(triggerValue).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public AchievementsDTO save(AchievementsDTO dto, Teacher createdBy, Topics topic) {
        Achievements entity = convertFromDTO(dto, createdBy, topic);
        return convertToDTO(achievementsRepository.save(entity));
    }

    // PATCH: Update achievement name
    public AchievementsDTO updateName(Long achievementId, String newName) {
        Optional<Achievements> achOpt = achievementsRepository.findById(achievementId);
        if (achOpt.isPresent()) {
            Achievements ach = achOpt.get();
            ach.setName(newName);
            return convertToDTO(achievementsRepository.save(ach));
        }
        return null;
    }

    // PATCH: Update achievement description
    public AchievementsDTO updateDescription(Long achievementId, String newDescription) {
        Optional<Achievements> achOpt = achievementsRepository.findById(achievementId);
        if (achOpt.isPresent()) {
            Achievements ach = achOpt.get();
            ach.setDescription(newDescription);
            return convertToDTO(achievementsRepository.save(ach));
        }
        return null;
    }

    // PATCH: Update achievement createdBy
    public AchievementsDTO updateCreatedBy(Long achievementId, Teacher newCreatedBy) {
        Optional<Achievements> achOpt = achievementsRepository.findById(achievementId);
        if (achOpt.isPresent()) {
            Achievements ach = achOpt.get();
            ach.setCreatedBy(newCreatedBy);
            return convertToDTO(achievementsRepository.save(ach));
        }
        return null;
    }

    // PATCH: Update achievement topic
    public AchievementsDTO updateTopic(Long achievementId, Topics newTopic) {
        Optional<Achievements> achOpt = achievementsRepository.findById(achievementId);
        if (achOpt.isPresent()) {
            Achievements ach = achOpt.get();
            ach.setTopicId(newTopic);
            return convertToDTO(achievementsRepository.save(ach));
        }
        return null;
    }

    // PATCH: Update achievement createdAt
    public AchievementsDTO updateCreatedAt(Long achievementId, LocalDateTime newCreatedAt) {
        Optional<Achievements> achOpt = achievementsRepository.findById(achievementId);
        if (achOpt.isPresent()) {
            Achievements ach = achOpt.get();
            ach.setCreatedAt(newCreatedAt);
            return convertToDTO(achievementsRepository.save(ach));
        }
        return null;
    }

    // PATCH: Update achievement triggerType
    public AchievementsDTO updateTriggerType(Long achievementId, String newTriggerType) {
        Optional<Achievements> achOpt = achievementsRepository.findById(achievementId);
        if (achOpt.isPresent()) {
            Achievements ach = achOpt.get();
            ach.setTriggerType(newTriggerType);
            return convertToDTO(achievementsRepository.save(ach));
        }
        return null;
    }

    // PATCH: Update achievement triggerValue
    public AchievementsDTO updateTriggerValue(Long achievementId, Integer newTriggerValue) {
        Optional<Achievements> achOpt = achievementsRepository.findById(achievementId);
        if (achOpt.isPresent()) {
            Achievements ach = achOpt.get();
            ach.setTriggerValue(newTriggerValue);
            return convertToDTO(achievementsRepository.save(ach));
        }
        return null;
    }

    public void deleteById(Long id) {
        achievementsRepository.deleteById(id);
    }

    public AchievementsDTO convertToDTO(Achievements entity) {
        if (entity == null) return null;
        return AchievementsDTO.builder()
                .achievementId(entity.getAchievementId())
                .name(entity.getName())
                .description(entity.getDescription())
                .createdById(entity.getCreatedBy() != null ? entity.getCreatedBy().getTeacherId() : null)
                .topicId(entity.getTopicId() != null ? entity.getTopicId().getTopicId() : null)
                .createdAt(entity.getCreatedAt())
                .triggerType(entity.getTriggerType())
                .triggerValue(entity.getTriggerValue())
                .build();
    }

    public Achievements convertFromDTO(AchievementsDTO dto, Teacher createdBy, Topics topic) {
        if (dto == null) return null;
        Achievements entity = new Achievements();
        entity.setAchievementId(dto.getAchievementId());
        entity.setName(dto.getName());
        entity.setDescription(dto.getDescription());
        entity.setCreatedBy(createdBy);
        entity.setTopicId(topic);
        entity.setCreatedAt(dto.getCreatedAt());
        entity.setTriggerType(dto.getTriggerType());
        entity.setTriggerValue(dto.getTriggerValue());
        return entity;
    }
}
