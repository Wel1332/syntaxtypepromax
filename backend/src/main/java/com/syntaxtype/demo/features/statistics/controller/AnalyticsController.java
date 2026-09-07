package com.syntaxtype.demo.features.statistics.controller;

import com.syntaxtype.demo.features.lesson.entity.DrillAttempt;
import com.syntaxtype.demo.features.lesson.entity.Score;
import com.syntaxtype.demo.features.lesson.repository.DrillAttemptRepository;
import com.syntaxtype.demo.features.lesson.repository.ScoreRepository;
import com.syntaxtype.demo.features.user.entity.User;
import com.syntaxtype.demo.features.statistics.dto.AnalyticsProgressDTO;
import com.syntaxtype.demo.features.statistics.entity.StudentAchievements;
import com.syntaxtype.demo.features.statistics.entity.UserStatistics;
import com.syntaxtype.demo.features.statistics.repository.StudentAchievementsRepository;
import com.syntaxtype.demo.features.statistics.repository.UserStatisticsRepository;
import com.syntaxtype.demo.features.user.entity.Student;
import com.syntaxtype.demo.features.user.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final StudentRepository studentRepository;
    private final UserStatisticsRepository userStatisticsRepository;
    private final ScoreRepository scoreRepository;
    private final DrillAttemptRepository drillAttemptRepository;
    private final StudentAchievementsRepository studentAchievementsRepository;

    // Games whose objectives are measured via pre/post assessment.
    private static final Map<String, String> GAME_LABELS = new LinkedHashMap<>() {{
        put("FALLING_WORDS", "Bug Smasher (Falling Code)");
        put("SYNTAX_SAVER", "Syntax Sniper");
        put("CODE_CHALLENGES", "Translation Terminal");
    }};

    // ─────────────────────────────────────────────────────────────────────────
    // Lifetime aggregate export (existing) + badge count
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * GET /api/analytics/students.csv
     * UTF-8 CSV of every student's profile + lifetime statistics + badges earned.
     */
    @GetMapping("/students.csv")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> exportStudentsCsv() {
        List<Student> students = studentRepository.findAll();

        Map<Long, UserStatistics> statsById = userStatisticsRepository.findAll().stream()
                .filter(us -> us.getUser() != null)
                .collect(Collectors.toMap(
                        us -> us.getUser().getUserId(),
                        us -> us,
                        (a, b) -> a));

        Map<Long, Long> badgesById = badgeCountsByUserId();

        StringBuilder csv = new StringBuilder();
        csv.append("Name,Username,University Email,Course,Year Level,Class,Section,"
                + "Best WPM,Accuracy (%),Tests Taken,Total Errors,Total Time (sec),Lifetime XP,Badges Earned\n");

        for (Student s : students) {
            Long uid = s.getUser() != null ? s.getUser().getUserId() : null;
            UserStatistics us = uid != null ? statsById.get(uid) : null;

            csv.append(csv(s.getFirstName() + " " + s.getLastName())).append(',');
            csv.append(csv(s.getUser() != null ? s.getUser().getUsername() : "")).append(',');
            csv.append(csv(s.getUniversityEmail())).append(',');
            csv.append(csv(s.getCourse())).append(',');
            csv.append(csv(s.getYearLevel())).append(',');
            csv.append(csv(s.getClassName())).append(',');
            csv.append(csv(s.getSection())).append(',');
            csv.append(us != null && us.getWordsPerMinute()  != null ? us.getWordsPerMinute()  : 0).append(',');
            csv.append(us != null && us.getAccuracy()        != null ? us.getAccuracy()        : 0).append(',');
            csv.append(us != null && us.getTotalTestsTaken() != null ? us.getTotalTestsTaken() : 0).append(',');
            csv.append(us != null && us.getTotalErrors()     != null ? us.getTotalErrors()     : 0).append(',');
            csv.append(us != null && us.getTotalTimeSpent()  != null ? us.getTotalTimeSpent()  : 0).append(',');
            csv.append(us != null && us.getLifetimeXp()      != null ? us.getLifetimeXp()      : 0).append(',');
            csv.append(uid != null ? badgesById.getOrDefault(uid, 0L) : 0L).append('\n');
        }

        return csvResponse(csv.toString(), "students_analytics.csv");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Pre-test → Post-test progress (new) — the core objective measurement
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * GET /api/analytics/progress
     * Per-game pre→post improvement for the three objective game modes, with a
     * cohort summary plus per-student rows. Used by the Teacher dashboard.
     */
    @GetMapping("/progress")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @Transactional(readOnly = true)
    public ResponseEntity<List<AnalyticsProgressDTO>> progress() {
        return ResponseEntity.ok(buildProgress());
    }

    /** GET /api/analytics/progress.csv — same data, flat CSV for download. */
    @GetMapping("/progress.csv")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> progressCsv() {
        StringBuilder csv = new StringBuilder();
        csv.append("Game,Name,Username,Section,Pre Score,Post Score,"
                + "Pre Accuracy (%),Post Accuracy (%),Accuracy Improvement (pp),"
                + "Pre Attempts,Post Attempts\n");

        for (AnalyticsProgressDTO game : buildProgress()) {
            for (AnalyticsProgressDTO.StudentRow r : game.getRows()) {
                csv.append(csv(game.getLabel())).append(',');
                csv.append(csv(r.getName())).append(',');
                csv.append(csv(r.getUsername())).append(',');
                csv.append(csv(r.getSection())).append(',');
                csv.append(r.getPreScore()  != null ? r.getPreScore()  : "").append(',');
                csv.append(r.getPostScore() != null ? r.getPostScore() : "").append(',');
                csv.append(r.getPrePercent()  != null ? r.getPrePercent()  : "").append(',');
                csv.append(r.getPostPercent() != null ? r.getPostPercent() : "").append(',');
                csv.append(r.getImprovementPercent() != null ? r.getImprovementPercent() : "").append(',');
                csv.append(r.getPreAttempts()).append(',');
                csv.append(r.getPostAttempts()).append('\n');
            }
        }

        return csvResponse(csv.toString(), "progress_pre_post.csv");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Per-drill detail (Objective 2.3)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * GET /api/analytics/drills.csv
     *
     * One row per drill attempted, rather than one row per session. This is what
     * makes the error distribution in Objective 2.3 recoverable: grouping the
     * rows by Topic or Error Category gives where students go wrong, and Time
     * (ms) gives the per-drill completion time the aggregate never stored.
     *
     * Rows only exist for sessions whose game sent per-drill detail, so a cohort
     * that played before this shipped exports as an empty body with headers —
     * deliberately, because inventing rows from the session aggregate would put
     * fabricated per-drill figures into the study data.
     */
    @GetMapping("/drills.csv")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> drillsCsv() {
        List<DrillAttempt> attempts = drillAttemptRepository.findAllWithSessionAndUser();

        Map<Long, Student> studentsById = studentRepository.findAll().stream()
                .filter(s -> s.getUser() != null)
                .collect(Collectors.toMap(s -> s.getUser().getUserId(), s -> s, (a, b) -> a));

        StringBuilder csv = new StringBuilder();
        csv.append("Game,Name,Username,Section,Mode,Session,Submitted At,"
                + "Position,Drill Id,Topic,Difficulty,Cleared,Time (ms),Misses,Error Category\n");

        for (DrillAttempt d : attempts) {
            Score s = d.getScore();
            User u = s.getUser();
            Long uid = u != null ? u.getUserId() : null;
            Student st = uid != null ? studentsById.get(uid) : null;

            csv.append(csv(GAME_LABELS.getOrDefault(s.getChallengeType(), s.getChallengeType()))).append(',');
            csv.append(csv(st != null ? st.getFirstName() + " " + st.getLastName() : "")).append(',');
            csv.append(csv(u != null ? u.getUsername() : "")).append(',');
            csv.append(csv(st != null ? st.getSection() : "")).append(',');
            csv.append(csv(s.getModeType() != null ? s.getModeType() : "")).append(',');
            csv.append(s.getId()).append(',');
            csv.append(csv(s.getSubmittedAt() != null ? s.getSubmittedAt().toString() : "")).append(',');
            csv.append(d.getPosition()).append(',');
            csv.append(csv(d.getItemId())).append(',');
            csv.append(csv(d.getTopic())).append(',');
            csv.append(csv(d.getDifficulty())).append(',');
            csv.append(d.isCleared() ? "yes" : "no").append(',');
            csv.append(d.getTimeMs()).append(',');
            csv.append(d.getMisses()).append(',');
            csv.append(csv(d.getErrorCategory())).append('\n');
        }

        return csvResponse(csv.toString(), "drill_attempts.csv");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal computation
    // ─────────────────────────────────────────────────────────────────────────

    private List<AnalyticsProgressDTO> buildProgress() {
        List<Score> scores = scoreRepository.findAssessmentScoresWithUser();

        // userId -> Student (name/section)
        Map<Long, Student> studentsById = studentRepository.findAll().stream()
                .filter(s -> s.getUser() != null)
                .collect(Collectors.toMap(s -> s.getUser().getUserId(), s -> s, (a, b) -> a));

        // game -> userId -> Agg(pre/post best)
        Map<String, Map<Long, Agg>> byGame = new LinkedHashMap<>();
        GAME_LABELS.keySet().forEach(g -> byGame.put(g, new LinkedHashMap<>()));

        for (Score s : scores) {
            String game = s.getChallengeType();
            if (!byGame.containsKey(game) || s.getUser() == null) continue;
            Long uid = s.getUser().getUserId();
            Agg agg = byGame.get(game).computeIfAbsent(uid, k -> new Agg());
            boolean pre = "PRE_TEST".equals(s.getModeType());
            if (pre) {
                agg.preAttempts++;
                agg.preScore = Math.max(agg.preScore, s.getScore());
                agg.prePercent = Math.max(agg.prePercent, s.getAccuracy());
                agg.hasPre = true;
            } else { // POST_TEST (query only returns PRE/POST)
                agg.postAttempts++;
                agg.postScore = Math.max(agg.postScore, s.getScore());
                agg.postPercent = Math.max(agg.postPercent, s.getAccuracy());
                agg.hasPost = true;
            }
        }

        List<AnalyticsProgressDTO> out = new ArrayList<>();
        for (Map.Entry<String, String> game : GAME_LABELS.entrySet()) {
            Map<Long, Agg> perUser = byGame.get(game.getKey());

            List<AnalyticsProgressDTO.StudentRow> rows = new ArrayList<>();
            int both = 0;
            double sumPre = 0, sumPost = 0, sumImp = 0, sumPreScore = 0, sumPostScore = 0;

            for (Map.Entry<Long, Agg> e : perUser.entrySet()) {
                Student st = studentsById.get(e.getKey());
                Agg a = e.getValue();
                Integer imp = (a.hasPre && a.hasPost) ? (a.postPercent - a.prePercent) : null;

                rows.add(AnalyticsProgressDTO.StudentRow.builder()
                        .name(st != null ? st.getFirstName() + " " + st.getLastName() : "User #" + e.getKey())
                        .username(st != null && st.getUser() != null ? st.getUser().getUsername() : "")
                        .section(st != null ? st.getSection() : "")
                        .preScore(a.hasPre ? a.preScore : null)
                        .postScore(a.hasPost ? a.postScore : null)
                        .prePercent(a.hasPre ? a.prePercent : null)
                        .postPercent(a.hasPost ? a.postPercent : null)
                        .improvementPercent(imp)
                        .preAttempts(a.preAttempts)
                        .postAttempts(a.postAttempts)
                        .build());

                if (a.hasPre && a.hasPost) {
                    both++;
                    sumPre += a.prePercent;
                    sumPost += a.postPercent;
                    sumImp += (a.postPercent - a.prePercent);
                    sumPreScore += a.preScore;
                    sumPostScore += a.postScore;
                }
            }

            out.add(AnalyticsProgressDTO.builder()
                    .game(game.getKey())
                    .label(game.getValue())
                    .studentsAssessed(both)
                    .avgPrePercent(both == 0 ? 0 : round1(sumPre / both))
                    .avgPostPercent(both == 0 ? 0 : round1(sumPost / both))
                    .avgImprovementPercent(both == 0 ? 0 : round1(sumImp / both))
                    .avgPreScore(both == 0 ? 0 : round1(sumPreScore / both))
                    .avgPostScore(both == 0 ? 0 : round1(sumPostScore / both))
                    .rows(rows)
                    .build());
        }
        return out;
    }

    /** Per-user mutable accumulator for one game's pre/post bests. */
    private static class Agg {
        boolean hasPre, hasPost;
        int preScore, postScore, prePercent, postPercent, preAttempts, postAttempts;
    }

    private Map<Long, Long> badgeCountsByUserId() {
        Map<Long, Long> counts = new LinkedHashMap<>();
        for (StudentAchievements sa : studentAchievementsRepository.findAll()) {
            Student st = sa.getStudent();
            Long uid = (st != null && st.getUser() != null) ? st.getUser().getUserId() : null;
            if (uid != null) counts.merge(uid, 1L, Long::sum);
        }
        return counts;
    }

    private static double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }

    private ResponseEntity<byte[]> csvResponse(String content, String filename) {
        byte[] body = content.getBytes(StandardCharsets.UTF_8);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv; charset=UTF-8"));
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");
        headers.setContentLength(body.length);
        return ResponseEntity.ok().headers(headers).body(body);
    }

    /** Wraps a value in double-quotes if it contains a comma, quote, or newline. */
    private String csv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
