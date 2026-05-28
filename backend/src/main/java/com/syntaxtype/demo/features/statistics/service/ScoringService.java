package com.syntaxtype.demo.features.statistics.service;

import com.syntaxtype.demo.features.statistics.dto.ScoringDTO;
import com.syntaxtype.demo.features.statistics.entity.Scoring;
import com.syntaxtype.demo.features.user.entity.User;
import com.syntaxtype.demo.core.enums.Category;
import com.syntaxtype.demo.features.statistics.repository.ScoringRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ScoringService {
    private final ScoringRepository scoringRepository;

    public List<ScoringDTO> findAll() {
        return scoringRepository.findAll().stream()
                .map(this::convertToDTO)
                .toList();
    }

    public Optional<ScoringDTO> findByScoringId(Long scoringId) {
        return scoringRepository.findById(scoringId)
                .map(this::convertToDTO);
    }

    public Optional<ScoringDTO> findByUser(User user) {
        return scoringRepository.findByUser(user)
                .map(this::convertToDTO);
    }

    public List<ScoringDTO> findByTotalScore(Integer totalScore) {
        return scoringRepository.findByTotalScore(totalScore).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<ScoringDTO> findByCorrectAnswers(Integer correctAnswers) {
        return scoringRepository.findByCorrectAnswers(correctAnswers).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<ScoringDTO> findByWrongAnswers(Integer wrongAnswers) {
        return scoringRepository.findByWrongAnswers(wrongAnswers).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<ScoringDTO> findByTotalTimeSpent(Integer totalTimeSpent) {
        return scoringRepository.findByTotalTimeSpent(totalTimeSpent).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<ScoringDTO> findByAverageTimeSpentBetweenWords(Double averageTimeSpentBetweenWords) {
        return scoringRepository.findByAverageTimeSpentBetweenWords(averageTimeSpentBetweenWords).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<ScoringDTO> findByAnsweredWords(List<String> answeredWords) {
        return scoringRepository.findByAnsweredWords(answeredWords).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<ScoringDTO> findByWrongWords(List<String> wrongWords) {
        return scoringRepository.findByWrongWords(wrongWords).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<ScoringDTO> findByCategory(Category category) {
        return scoringRepository.findByCategory(category).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public ScoringDTO save(ScoringDTO scoringDTO, User user) {
        Scoring scoring = convertFromDTO(scoringDTO, user);
        return convertToDTO(scoringRepository.save(scoring));
    }

    // PATCH: Update total score
    public ScoringDTO updateTotalScore(Long scoringId, Integer newTotalScore) {
        Optional<Scoring> scoringOpt = scoringRepository.findById(scoringId);
        if (scoringOpt.isPresent()) {
            Scoring scoring = scoringOpt.get();
            scoring.setTotalScore(newTotalScore);

            return convertToDTO(scoringRepository.save(scoring));
        }

        return null;
    }

    // PATCH: Update correctAnswers
    public ScoringDTO updateCorrectAnswers(Long scoringId, Integer newCorrectAnswers) {
        Optional<Scoring> scoringOpt = scoringRepository.findById(scoringId);
        if (scoringOpt.isPresent()) {
            Scoring scoring = scoringOpt.get();
            scoring.setCorrectAnswers(newCorrectAnswers);

            return convertToDTO(scoringRepository.save(scoring));
        }

        return null;
    }

    // PATCH: Update wrong answers
    public ScoringDTO updateWrongAnswers(Long scoringId, Integer newWrongAnswers) {
        Optional<Scoring> scoringOpt = scoringRepository.findById(scoringId);
        if (scoringOpt.isPresent()) {
            Scoring scoring = scoringOpt.get();
            scoring.setWrongAnswers(newWrongAnswers);

            return convertToDTO(scoringRepository.save(scoring));
        }

        return null;
    }

    // PATCH: Update total time spent
    public ScoringDTO updateTotalTimeSpent(Long scoringId, Integer newTotalTimeSpent) {
        Optional<Scoring> scoringOpt = scoringRepository.findById(scoringId);
        if (scoringOpt.isPresent()) {
            Scoring scoring = scoringOpt.get();
            scoring.setTotalTimeSpent(newTotalTimeSpent);

            return convertToDTO(scoringRepository.save(scoring));
        }

        return null;
    }

    // PATCH: Update average time spent between words
    public ScoringDTO updateAverageTimeSpentBetweenWords(Long scoringId, Double newAVTSBW) {
        Optional<Scoring> scoringOpt = scoringRepository.findById(scoringId);
        if(scoringOpt.isPresent()) {
            Scoring scoring = scoringOpt.get();
            scoring.setAverageTimeSpentBetweenWords(newAVTSBW);

            return convertToDTO(scoringRepository.save(scoring));
        }

        return null;
    }

    // PATCH: Update list of answered words
    public ScoringDTO updateAnsweredWords(Long scoringId, List<String> newAnsweredWords) {
        Optional<Scoring> scoringOpt = scoringRepository.findById(scoringId);
        if(scoringOpt.isPresent()) {
            Scoring scoring = scoringOpt.get();
            scoring.setAnsweredWords(newAnsweredWords);

            return convertToDTO(scoringRepository.save(scoring));
        }

        return null;
    }

    // PATCH: Update list of answered but wrong words
    public ScoringDTO updateWrongWords(Long scoringId, List<String> newWrongWords) {
        Optional<Scoring> scoringOpt = scoringRepository.findById(scoringId);
        if(scoringOpt.isPresent()) {
            Scoring scoring = scoringOpt.get();
            scoring.setWrongWords(newWrongWords);

            return convertToDTO(scoringRepository.save(scoring));
        }

        return null;
    }

    // PATCH: Update category
    public ScoringDTO updateCategory(Long scoringId, Category newCategory) {
        Optional<Scoring> scoringOpt = scoringRepository.findById(scoringId);
        if (scoringOpt.isPresent()) {
            Scoring scoring = scoringOpt.get();
            scoring.setCategory(newCategory);

            return convertToDTO(scoringRepository.save(scoring));
        }

        return null;
    }

    public void deleteById(Long id) {
        scoringRepository.deleteById(id);
    }

    public ScoringDTO convertToDTO(Scoring scoring) {
        if (scoring == null) return null;

        return ScoringDTO.builder()
                .scoringId(scoring.getScoringId())
                .userId(scoring.getUser() != null ? scoring.getUser().getUserId() : null)
                .totalScore(scoring.getTotalScore())
                .correctAnswers(scoring.getCorrectAnswers())
                .wrongAnswers(scoring.getWrongAnswers())
                .totalTimeSpent(scoring.getTotalTimeSpent())
                .averageTimeSpentBetweenWords(scoring.getAverageTimeSpentBetweenWords())
                .answeredWords(scoring.getAnsweredWords())
                .wrongWords(scoring.getWrongWords())
                .category(scoring.getCategory())
                .build();
    }

    public Scoring convertFromDTO(ScoringDTO dto, User user) {
        if (dto == null) return null;

        Scoring scoring = new Scoring();

        scoring.setScoringId(dto.getScoringId());
        scoring.setUser(user);
        scoring.setTotalScore(dto.getTotalScore());
        scoring.setCorrectAnswers(dto.getCorrectAnswers());
        scoring.setWrongAnswers(dto.getWrongAnswers());
        scoring.setTotalTimeSpent(dto.getTotalTimeSpent());
        scoring.setAverageTimeSpentBetweenWords(dto.getAverageTimeSpentBetweenWords());
        scoring.setAnsweredWords(dto.getAnsweredWords());
        scoring.setWrongWords(dto.getWrongWords());
        scoring.setCategory(dto.getCategory());

        return scoring;
    }
}
