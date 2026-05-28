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
                .lifetimeXp(userStatistics.getLifetimeXp())
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
        us.setLifetimeXp(dto.getLifetimeXp() != null ? dto.getLifetimeXp() : 0L);
        return us;
    }

    /**
     * Records one session: updates all cumulative UserStatistics fields and adds XP.
     * Best WPM is tracked as a high-water mark; accuracy is a running average;
     * totalTestsTaken and totalTimeSpent accumulate across every session.
     * Creates the UserStatistics row if it does not exist yet.
     */
    public void recordSession(User user, int wpm, int accuracy, int timeSpentSeconds, int rawScore) {
        if (user == null) return;
        Optional<UserStatistics> statsOpt = userStatisticsRepository.findByUser(user);
        UserStatistics stats;
        if (statsOpt.isPresent()) {
            stats = statsOpt.get();
        } else {
            stats = UserStatistics.builder()
                    .user(user)
                    .wordsPerMinute(0).accuracy(0)
                    .totalWordsTyped(0).totalTimeSpent(0)
                    .totalErrors(0).totalTestsTaken(0)
                    .fastestClearTime(0).lifetimeXp(0L)
                    .build();
        }

        int prevTests = stats.getTotalTestsTaken() != null ? stats.getTotalTestsTaken() : 0;
        int newTests  = prevTests + 1;

        // Best (highest) WPM seen across all sessions
        int prevWpm = stats.getWordsPerMinute() != null ? stats.getWordsPerMinute() : 0;
        stats.setWordsPerMinute(Math.max(prevWpm, wpm));

        // Rolling average accuracy
        int prevAcc = stats.getAccuracy() != null ? stats.getAccuracy() : 0;
        stats.setAccuracy(prevTests == 0 ? accuracy : ((prevAcc * prevTests) + accuracy) / newTests);

        // Cumulative time (seconds)
        int prevTime = stats.getTotalTimeSpent() != null ? stats.getTotalTimeSpent() : 0;
        stats.setTotalTimeSpent(prevTime + timeSpentSeconds);

        // Session count
        stats.setTotalTestsTaken(newTests);

        // Lifetime XP
        long prevXp = stats.getLifetimeXp() != null ? stats.getLifetimeXp() : 0L;
        stats.setLifetimeXp(prevXp + Math.max(0, rawScore));

        userStatisticsRepository.save(stats);
    }

    /** Convenience wrapper kept for call-sites that only need XP. */
    public void addLifetimeXp(User user, int amount) {
        recordSession(user, 0, 0, 0, amount);
    }

    public UserStatisticsDTO getStatisticsForUserAndLesson(Long userId, Long lessonId) {
        // TODO: Implement actual logic to fetch statistics
        return new UserStatisticsDTO(); // Return dummy or real data as needed
    }
}
