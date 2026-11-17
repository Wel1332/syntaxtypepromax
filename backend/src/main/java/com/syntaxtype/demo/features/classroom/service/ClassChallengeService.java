package com.syntaxtype.demo.features.classroom.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.syntaxtype.demo.features.classroom.dto.ChallengeAttemptRequest;
import com.syntaxtype.demo.features.classroom.dto.ChallengeAttemptResultDTO;
import com.syntaxtype.demo.features.classroom.dto.ClassChallengeDTO;
import com.syntaxtype.demo.features.classroom.dto.ClassChallengeRequest;
import com.syntaxtype.demo.features.classroom.dto.ClassChallengeResultsDTO;
import com.syntaxtype.demo.features.classroom.entity.ClassChallenge;
import com.syntaxtype.demo.features.classroom.entity.ClassChallengeAttempt;
import com.syntaxtype.demo.features.classroom.entity.ClassEnrollment;
import com.syntaxtype.demo.features.classroom.entity.Classroom;
import com.syntaxtype.demo.features.classroom.repository.ClassChallengeAttemptRepository;
import com.syntaxtype.demo.features.classroom.repository.ClassChallengeRepository;
import com.syntaxtype.demo.features.classroom.repository.ClassEnrollmentRepository;
import com.syntaxtype.demo.features.user.entity.Student;
import com.syntaxtype.demo.features.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Challenges a teacher makes for one class.
 *
 * Two rules carry the feature, and every method goes through one of them:
 * - managing a challenge needs ownership of its class (or admin), via
 *   ClassroomService.requireOwnedClassroom;
 * - seeing or playing one needs it to be visible and the student to be enrolled
 *   in its class right now, via canPlay. Anything else is reported as "not
 *   found", so an outsider can't even learn that a challenge exists.
 */
@Service
@RequiredArgsConstructor
public class ClassChallengeService {

    static final int MAX_ATTEMPT_LIMIT = 100;

    private static final TypeReference<List<Map<String, Object>>> ITEMS = new TypeReference<>() {
    };

    private final ClassChallengeRepository challengeRepository;
    private final ClassChallengeAttemptRepository attemptRepository;
    private final ClassEnrollmentRepository enrollmentRepository;
    private final ClassroomService classroomService;
    private final ObjectMapper objectMapper;

    // ── Teacher (class owner) or admin ────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ClassChallengeDTO> listForClass(Long classroomId, User user) {
        Classroom classroom = classroomService.requireOwnedClassroom(classroomId, user);
        return challengeRepository.findByClassroomOrderByCreatedAtDesc(classroom).stream()
                .map(c -> teacherView(c, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public ClassChallengeDTO getForTeacher(Long classroomId, Long challengeId, User user) {
        Classroom classroom = classroomService.requireOwnedClassroom(classroomId, user);
        return teacherView(requireInClass(classroom, challengeId), true);
    }

    @Transactional
    public ClassChallengeDTO create(Long classroomId, User user, ClassChallengeRequest request) {
        Classroom classroom = classroomService.requireOwnedClassroom(classroomId, user);
        if (request.getGame() == null) {
            throw bad("Choose a game.");
        }
        ClassChallenge challenge = new ClassChallenge();
        challenge.setClassroom(classroom);
        challenge.setGame(request.getGame());
        apply(challenge, request);
        return teacherView(challengeRepository.save(challenge), true);
    }

    /** Replaces the challenge's contents, so an absent `visible` hides it. */
    @Transactional
    public ClassChallengeDTO update(Long classroomId, Long challengeId, User user, ClassChallengeRequest request) {
        Classroom classroom = classroomService.requireOwnedClassroom(classroomId, user);
        ClassChallenge challenge = requireInClass(classroom, challengeId);
        // Past attempts were played in the original game; switching would make them meaningless.
        if (request.getGame() != null && request.getGame() != challenge.getGame()) {
            throw bad("A challenge's game can't be changed. Create a new challenge instead.");
        }
        apply(challenge, request);
        return teacherView(challengeRepository.save(challenge), true);
    }

    /** Every student's attempts: everyone in the class now, and anyone who played before leaving it. */
    @Transactional(readOnly = true)
    public ClassChallengeResultsDTO results(Long classroomId, Long challengeId, User user) {
        Classroom classroom = classroomService.requireOwnedClassroom(classroomId, user);
        ClassChallenge challenge = requireInClass(classroom, challengeId);

        Map<Long, Student> students = new LinkedHashMap<>();
        Set<Long> enrolled = new HashSet<>();
        for (ClassEnrollment enrollment : enrollmentRepository.findWithStudentsByClassroom(classroom)) {
            students.put(enrollment.getStudent().getStudentId(), enrollment.getStudent());
            enrolled.add(enrollment.getStudent().getStudentId());
        }
        Map<Long, List<ClassChallengeResultsDTO.Attempt>> attempts = new HashMap<>();
        for (ClassChallengeAttempt attempt : attemptRepository.findByChallengeOrderBySubmittedAtDescAttemptIdDesc(challenge)) {
            Student student = attempt.getStudent();
            students.putIfAbsent(student.getStudentId(), student);
            attempts.computeIfAbsent(student.getStudentId(), id -> new ArrayList<>()).add(resultOf(attempt));
        }

        List<ClassChallengeResultsDTO.StudentResults> rows = students.values().stream()
                .map(s -> new ClassChallengeResultsDTO.StudentResults(
                        s.getStudentId(), displayName(s), username(s),
                        enrolled.contains(s.getStudentId()),
                        attempts.getOrDefault(s.getStudentId(), List.of())))
                .sorted(Comparator.comparing(ClassChallengeResultsDTO.StudentResults::name, String.CASE_INSENSITIVE_ORDER))
                .toList();
        return new ClassChallengeResultsDTO(teacherView(challenge, false), rows);
    }

    @Transactional
    public void delete(Long classroomId, Long challengeId, User user) {
        Classroom classroom = classroomService.requireOwnedClassroom(classroomId, user);
        ClassChallenge challenge = requireInClass(classroom, challengeId);
        attemptRepository.deleteByChallengeIn(List.of(challenge));
        challengeRepository.delete(challenge);
    }

    // ── Students in the class ─────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ClassChallengeDTO> listForStudent(User user) {
        Student student = classroomService.requireStudent(user);
        List<Classroom> classes = enrollmentRepository.findByStudent(student).stream()
                .map(ClassEnrollment::getClassroom)
                .toList();
        if (classes.isEmpty()) {
            return List.of();
        }
        return challengeRepository.findByClassroomInAndVisibleTrueOrderByCreatedAtDesc(classes).stream()
                .map(c -> studentView(c, student, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public ClassChallengeDTO getForStudent(Long challengeId, User user) {
        Student student = classroomService.requireStudent(user);
        ClassChallenge challenge = challengeRepository.findById(challengeId)
                .filter(c -> canPlay(c, student))
                .orElseThrow(ClassChallengeService::notFound);
        return studentView(challenge, student, true);
    }

    @Transactional
    public ChallengeAttemptResultDTO recordAttempt(Long challengeId, User user, ChallengeAttemptRequest request) {
        Student student = classroomService.requireStudent(user);
        ClassChallenge challenge = challengeRepository.findByIdForUpdate(challengeId)
                .filter(c -> canPlay(c, student))
                .orElseThrow(ClassChallengeService::notFound);
        ClassChallengeAttempt attempt = toAttempt(request);

        long used = attemptRepository.countByChallengeAndStudent(challenge, student);
        Integer limit = challenge.getMaxAttempts();
        if (limit != null && used >= limit) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "You have used all " + limit + " attempts for this challenge.");
        }

        attempt.setChallenge(challenge);
        attempt.setStudent(student);
        attemptRepository.save(attempt);

        long nowUsed = used + 1;
        return new ChallengeAttemptResultDTO(nowUsed, limit == null ? null : Math.max(0, limit - nowUsed));
    }

    // ── Rules ─────────────────────────────────────────────────────────────

    private boolean canPlay(ClassChallenge challenge, Student student) {
        return challenge.isVisible()
                && enrollmentRepository.existsByClassroomAndStudent(challenge.getClassroom(), student);
    }

    private ClassChallenge requireInClass(Classroom classroom, Long challengeId) {
        return challengeRepository.findById(challengeId)
                .filter(c -> c.getClassroom().getClassroomId().equals(classroom.getClassroomId()))
                .orElseThrow(ClassChallengeService::notFound);
    }

    private void apply(ClassChallenge challenge, ClassChallengeRequest request) {
        String title = request.getTitle() == null ? "" : request.getTitle().strip();
        if (title.isEmpty()) {
            throw bad("Title is required.");
        }
        if (title.length() > 120) {
            throw bad("Title must be at most 120 characters.");
        }
        String instructions = request.getInstructions() == null ? "" : request.getInstructions().strip();
        if (instructions.length() > 1000) {
            throw bad("Instructions must be at most 1000 characters.");
        }
        Integer limit = request.getMaxAttempts();
        if (limit != null && (limit < 1 || limit > MAX_ATTEMPT_LIMIT)) {
            throw bad("Attempt limit must be between 1 and " + MAX_ATTEMPT_LIMIT + ", or empty for unlimited.");
        }
        List<Map<String, Object>> items = ClassChallengeItems.validate(challenge.getGame(), request.getItems());

        challenge.setTitle(title);
        challenge.setInstructions(instructions.isEmpty() ? null : instructions);
        challenge.setMaxAttempts(limit);
        challenge.setItemsJson(writeItems(items));
        challenge.setItemCount(items.size());
        challenge.setVisible(Boolean.TRUE.equals(request.getVisible()));
    }

    // The game grades on the student's device, so these bounds keep obvious
    // nonsense out of the teacher's results; they can't prove a score is honest.
    private static ClassChallengeAttempt toAttempt(ChallengeAttemptRequest request) {
        int score = orZero(request.getScore());
        int correct = orZero(request.getCorrectCount());
        int total = orZero(request.getTotalCount());
        int accuracy = orZero(request.getAccuracy());
        int duration = orZero(request.getDurationSeconds());

        if (score < 0 || score > 1_000_000) {
            throw bad("Score is out of range.");
        }
        if (correct < 0 || total < 0 || correct > total || total > 10_000) {
            throw bad("Correct and total counts don't add up.");
        }
        if (accuracy < 0 || accuracy > 100) {
            throw bad("Accuracy must be between 0 and 100.");
        }
        if (duration < 0 || duration > 86_400) {
            throw bad("Duration is out of range.");
        }

        ClassChallengeAttempt attempt = new ClassChallengeAttempt();
        attempt.setScore(score);
        attempt.setCorrectCount(correct);
        attempt.setTotalCount(total);
        attempt.setAccuracy(accuracy);
        attempt.setDurationSeconds(duration);
        return attempt;
    }

    // ── Views ─────────────────────────────────────────────────────────────

    // Attempts are stamped in the server's zone; an instant reads correctly anywhere.
    private static ClassChallengeResultsDTO.Attempt resultOf(ClassChallengeAttempt a) {
        Instant at = a.getSubmittedAt() == null ? null : a.getSubmittedAt().atZone(ZoneId.systemDefault()).toInstant();
        return new ClassChallengeResultsDTO.Attempt(
                a.getScore(), a.getCorrectCount(), a.getTotalCount(), a.getAccuracy(), a.getDurationSeconds(), at);
    }

    private static String username(Student s) {
        return s.getUser() == null ? null : s.getUser().getUsername();
    }

    private static String displayName(Student s) {
        String name = Stream.of(s.getFirstName(), s.getLastName())
                .filter(part -> part != null && !part.isBlank())
                .map(String::strip)
                .collect(Collectors.joining(" "));
        if (!name.isEmpty()) {
            return name;
        }
        String username = username(s);
        return username != null ? username : "Student " + s.getStudentId();
    }

    private ClassChallengeDTO teacherView(ClassChallenge c, boolean withItems) {
        return base(c, withItems)
                .visible(c.isVisible())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private ClassChallengeDTO studentView(ClassChallenge c, Student student, boolean withItems) {
        return base(c, withItems)
                .attemptsUsed(attemptRepository.countByChallengeAndStudent(c, student))
                .build();
    }

    private ClassChallengeDTO.ClassChallengeDTOBuilder base(ClassChallenge c, boolean withItems) {
        return ClassChallengeDTO.builder()
                .challengeId(c.getChallengeId())
                .classroomId(c.getClassroom().getClassroomId())
                .classroomName(c.getClassroom().getName())
                .game(c.getGame())
                .title(c.getTitle())
                .instructions(c.getInstructions())
                .itemCount(c.getItemCount())
                .maxAttempts(c.getMaxAttempts())
                .items(withItems ? readItems(c.getItemsJson()) : null);
    }

    private String writeItems(List<Map<String, Object>> items) {
        try {
            return objectMapper.writeValueAsString(items);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Could not store challenge items", e);
        }
    }

    private List<Map<String, Object>> readItems(String json) {
        try {
            return objectMapper.readValue(json, ITEMS);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Stored challenge items are not valid JSON", e);
        }
    }

    private static int orZero(Integer value) {
        return value == null ? 0 : value;
    }

    private static ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Challenge not found.");
    }

    private static ResponseStatusException bad(String reason) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, reason);
    }
}
