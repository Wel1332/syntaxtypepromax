package com.syntaxtype.demo.features.statistics.service;

import com.syntaxtype.demo.features.statistics.dto.UserStatisticsDTO;
import com.syntaxtype.demo.features.statistics.entity.UserStatistics;
import com.syntaxtype.demo.features.user.entity.User;
import com.syntaxtype.demo.features.statistics.repository.UserStatisticsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserStatisticsService {
    private final UserStatisticsRepository userStatisticsRepository;

    public List<UserStatisticsDTO> findAll() {
        return userStatisticsRepository.findAll().stream()
                .map(this::convertToDTO)
                .toList();
    }

    public Optional<UserStatisticsDTO> findByUser(User user) {
        return userStatisticsRepository.findByUser(user)
                .map(this::convertToDTO);
    }

    public List<UserStatisticsDTO> findByWordsPerMinute(Integer wordsPerMinute) {
        return userStatisticsRepository.findByWordsPerMinute(wordsPerMinute).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<UserStatisticsDTO> findByAccuracy(Integer accuracy) {
        return userStatisticsRepository.findByAccuracy(accuracy).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<UserStatisticsDTO> findByTotalWordsTyped(Integer totalWordsTyped) {
        return userStatisticsRepository.findByTotalWordsTyped(totalWordsTyped).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<UserStatisticsDTO> findByTotalTimeSpent(Integer totalTimeSpent) {
        return userStatisticsRepository.findByTotalTimeSpent(totalTimeSpent).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<UserStatisticsDTO> findByTotalErrors(Integer totalErrors) {
        return userStatisticsRepository.findByTotalErrors(totalErrors).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<UserStatisticsDTO> findByTotalTestsTaken(Integer totalTestsTaken) {
        return userStatisticsRepository.findByTotalTestsTaken(totalTestsTaken).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<UserStatisticsDTO> findByFastestClearTime(Integer fastestClearTime) {
        return userStatisticsRepository.findByFastestClearTime(fastestClearTime).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public Optional<UserStatisticsDTO> findById(Long id) {
        return userStatisticsRepository.findById(id)
                .map(this::convertToDTO);
    }

    public UserStatisticsDTO save(UserStatisticsDTO userStatisticsDTO, User user) {
        UserStatistics userStatistics = convertFromDTO(userStatisticsDTO, user);
        return convertToDTO(userStatisticsRepository.save(userStatistics));
    }

    // PATCH: Update user
    public UserStatisticsDTO updateUser(Long userStatisticsId, User user) {
        Optional<UserStatistics> statsOpt = userStatisticsRepository.findById(userStatisticsId);
        if (statsOpt.isPresent()) {
            UserStatistics stats = statsOpt.get();
            stats.setUser(user);
            return convertToDTO(userStatisticsRepository.save(stats));
        }
        return null;
    }

    // PATCH: Update words per minute
    public UserStatisticsDTO updateWordsPerMinute(Long userStatisticsId, Integer newWpm) {
        Optional<UserStatistics> statsOpt = userStatisticsRepository.findById(userStatisticsId);
        if (statsOpt.isPresent()) {
            UserStatistics stats = statsOpt.get();
            stats.setWordsPerMinute(newWpm);
            return convertToDTO(userStatisticsRepository.save(stats));
        }
        return null;
    }

    // PATCH: Update accuracy
    public UserStatisticsDTO updateAccuracy(Long userStatisticsId, Integer newAccuracy) {
        Optional<UserStatistics> statsOpt = userStatisticsRepository.findById(userStatisticsId);
        if (statsOpt.isPresent()) {
            UserStatistics stats = statsOpt.get();
            stats.setAccuracy(newAccuracy);
            return convertToDTO(userStatisticsRepository.save(stats));
        }
        return null;
    }

    // PATCH: Update total words typed
    public UserStatisticsDTO updateTotalWordsTyped(Long userStatisticsId, Integer newTotalWordsTyped) {
        Optional<UserStatistics> statsOpt = userStatisticsRepository.findById(userStatisticsId);
        if (statsOpt.isPresent()) {
            UserStatistics stats = statsOpt.get();
            stats.setTotalWordsTyped(newTotalWordsTyped);
            return convertToDTO(userStatisticsRepository.save(stats));
        }
        return null;
    }

    // PATCH: Update total time spent
    public UserStatisticsDTO updateTotalTimeSpent(Long userStatisticsId, Integer newTotalTimeSpent) {
        Optional<UserStatistics> statsOpt = userStatisticsRepository.findById(userStatisticsId);
        if (statsOpt.isPresent()) {
            UserStatistics stats = statsOpt.get();
            stats.setTotalTimeSpent(newTotalTimeSpent);
            return convertToDTO(userStatisticsRepository.save(stats));
        }
        return null;
    }

    // PATCH: Update total errors
    public UserStatisticsDTO updateTotalErrors(Long userStatisticsId, Integer newTotalErrors) {
        Optional<UserStatistics> statsOpt = userStatisticsRepository.findById(userStatisticsId);
        if (statsOpt.isPresent()) {
            UserStatistics stats = statsOpt.get();
            stats.setTotalErrors(newTotalErrors);
            return convertToDTO(userStatisticsRepository.save(stats));
        }
        return null;
    }

    // PATCH: Update total tests taken
    public UserStatisticsDTO updateTotalTestsTaken(Long userStatisticsId, Integer newTotalTestsTaken) {
        Optional<UserStatistics> statsOpt = userStatisticsRepository.findById(userStatisticsId);
        if (statsOpt.isPresent()) {
            UserStatistics stats = statsOpt.get();
            stats.setTotalTestsTaken(newTotalTestsTaken);
            return convertToDTO(userStatisticsRepository.save(stats));
        }
        return null;
    }

    // PATCH: Update fastest clear time
    public UserStatisticsDTO updateFastestClearTime(Long userStatisticsId, Integer newFastestClearTime) {
        Optional<UserStatistics> statsOpt = userStatisticsRepository.findById(userStatisticsId);
        if (statsOpt.isPresent()) {
            UserStatistics stats = statsOpt.get();
            stats.setFastestClearTime(newFastestClearTime);
            return convertToDTO(userStatisticsRepository.save(stats));
        }
        return null;
    }

    public void deleteById(Long id) {
        userStatisticsRepository.deleteById(id);
    }

    public UserStatisticsDTO convertToDTO(UserStatistics userStatistics) {
        if (userStatistics == null) return null;
        return UserStatisticsDTO.builder()
                .userId(userStatistics.getUser() != null ? userStatistics.getUser().getUserId() : null)
                .wordsPerMinute(userStatistics.getWordsPerMinute())
                .accuracy(userStatistics.getAccuracy())
                .totalWordsTyped(userStatistics.getTotalWordsTyped())
                .totalTimeSpent(userStatistics.getTotalTimeSpent())
                .totalErrors(userStatistics.getTotalErrors())
                .totalTestsTaken(userStatistics.getTotalTestsTaken())
                .fastestClearTime(userStatistics.getFastestClearTime())
                .build();
    }

    public UserStatistics convertFromDTO(UserStatisticsDTO dto, User user) {
        if (dto == null) return null;
        UserStatistics us = new UserStatistics();
        us.setUser(user);
        us.setWordsPerMinute(dto.getWordsPerMinute());
        us.setAccuracy(dto.getAccuracy());
        us.setTotalWordsTyped(dto.getTotalWordsTyped());
        us.setTotalTimeSpent(dto.getTotalTimeSpent());
        us.setTotalErrors(dto.getTotalErrors());
        us.setTotalTestsTaken(dto.getTotalTestsTaken());
        us.setFastestClearTime(dto.getFastestClearTime());
        return us;
    }

    public UserStatisticsDTO getStatisticsForUserAndLesson(Long userId, Long lessonId) {
        // TODO: Implement actual logic to fetch statistics
        return new UserStatisticsDTO(); // Return dummy or real data as needed
    }
}
