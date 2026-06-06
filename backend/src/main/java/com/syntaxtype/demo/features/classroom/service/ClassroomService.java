package com.syntaxtype.demo.features.classroom.service;

import com.syntaxtype.demo.features.classroom.dto.ClassroomDTO;
import com.syntaxtype.demo.features.classroom.dto.CreateClassRequest;
import com.syntaxtype.demo.features.classroom.entity.ClassEnrollment;
import com.syntaxtype.demo.features.classroom.entity.Classroom;
import com.syntaxtype.demo.features.classroom.repository.ClassEnrollmentRepository;
import com.syntaxtype.demo.features.classroom.repository.ClassroomRepository;
import com.syntaxtype.demo.features.user.dto.StudentDTO;
import com.syntaxtype.demo.features.user.entity.Student;
import com.syntaxtype.demo.features.user.entity.Teacher;
import com.syntaxtype.demo.features.user.entity.User;
import com.syntaxtype.demo.features.user.repository.StudentRepository;
import com.syntaxtype.demo.features.user.repository.TeacherRepository;
import com.syntaxtype.demo.features.user.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ClassroomService {
    // Excludes ambiguous characters (0/O, 1/I) for codes students type by hand.
    private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CODE_LENGTH = 6;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final ClassroomRepository classroomRepository;
    private final ClassEnrollmentRepository enrollmentRepository;
    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;
    private final StudentService studentService;

    // ── Teacher operations ────────────────────────────────────────────────

    @Transactional
    public ClassroomDTO createClass(User teacherUser, CreateClassRequest request) {
        if (request == null || request.getName() == null || request.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Class name is required.");
        }
        Teacher teacher = requireTeacher(teacherUser);

        Classroom classroom = Classroom.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .classCode(generateUniqueCode())
                .createdBy(teacher)
                .build();

        return convertToDTO(classroomRepository.save(classroom));
    }

    public List<ClassroomDTO> findMyClasses(User teacherUser) {
        Teacher teacher = requireTeacher(teacherUser);
        return classroomRepository.findByCreatedBy(teacher).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<StudentDTO> getRoster(Long classroomId, User requestingUser) {
        Classroom classroom = requireClassroom(classroomId);
        requireOwnerOrAdmin(classroom, requestingUser);
        return enrollmentRepository.findByClassroom(classroom).stream()
                .map(ClassEnrollment::getStudent)
                .map(studentService::convertToDTO)
                .toList();
    }

    @Transactional
    public void deleteClass(Long classroomId, User requestingUser) {
        Classroom classroom = requireClassroom(classroomId);
        requireOwnerOrAdmin(classroom, requestingUser);
        enrollmentRepository.deleteAll(enrollmentRepository.findByClassroom(classroom));
        classroomRepository.delete(classroom);
    }

    @Transactional
    public void removeStudent(Long classroomId, Long studentId, User requestingUser) {
        Classroom classroom = requireClassroom(classroomId);
        requireOwnerOrAdmin(classroom, requestingUser);
        enrollmentRepository
                .findByClassroom_ClassroomIdAndStudent_StudentId(classroomId, studentId)
                .ifPresent(enrollmentRepository::delete);
    }

    // ── Student operations ────────────────────────────────────────────────

    @Transactional
    public ClassroomDTO joinClass(User studentUser, String classCode) {
        if (classCode == null || classCode.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Class code is required.");
        }
        Student student = requireStudent(studentUser);
        Classroom classroom = classroomRepository.findByClassCode(classCode.trim().toUpperCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No class found for that code."));

        if (enrollmentRepository.existsByClassroomAndStudent(classroom, student)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You have already joined this class.");
        }

        ClassEnrollment enrollment = ClassEnrollment.builder()
                .classroom(classroom)
                .student(student)
                .build();
        enrollmentRepository.save(enrollment);

        return convertToDTO(classroom);
    }

    public List<ClassroomDTO> findEnrolledClasses(User studentUser) {
        Student student = requireStudent(studentUser);
        return enrollmentRepository.findByStudent(student).stream()
                .map(ClassEnrollment::getClassroom)
                .map(this::convertToDTO)
                .toList();
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private Teacher requireTeacher(User user) {
        return teacherRepository.findByUser_UserId(user.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Your account is not set up as a teacher."));
    }

    private Student requireStudent(User user) {
        return studentRepository.findByUser_UserId(user.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Your account is not set up as a student."));
    }

    private Classroom requireClassroom(Long classroomId) {
        return classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Class not found."));
    }

    /** Allows the owning teacher or any admin; everyone else is forbidden. */
    private void requireOwnerOrAdmin(Classroom classroom, User user) {
        boolean isAdmin = user.getUserRole() != null && "ADMIN".equals(user.getUserRole().name());
        boolean isOwner = classroom.getCreatedBy() != null
                && user.getUserId().equals(classroom.getCreatedBy().getTeacherId());
        if (!isAdmin && !isOwner) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this class.");
        }
    }

    private String generateUniqueCode() {
        for (int attempt = 0; attempt < 25; attempt++) {
            StringBuilder sb = new StringBuilder(CODE_LENGTH);
            for (int i = 0; i < CODE_LENGTH; i++) {
                sb.append(CODE_ALPHABET.charAt(RANDOM.nextInt(CODE_ALPHABET.length())));
            }
            String code = sb.toString();
            if (!classroomRepository.existsByClassCode(code)) {
                return code;
            }
        }
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Could not generate a unique class code. Please try again.");
    }

    public ClassroomDTO convertToDTO(Classroom classroom) {
        if (classroom == null) return null;
        Teacher teacher = classroom.getCreatedBy();
        String teacherName = teacher == null ? null
                : String.join(" ",
                        teacher.getFirstName() == null ? "" : teacher.getFirstName(),
                        teacher.getLastName() == null ? "" : teacher.getLastName()).trim();
        return ClassroomDTO.builder()
                .classroomId(classroom.getClassroomId())
                .name(classroom.getName())
                .description(classroom.getDescription())
                .classCode(classroom.getClassCode())
                .createdById(teacher != null ? teacher.getTeacherId() : null)
                .createdByName(teacherName != null && !teacherName.isBlank() ? teacherName : null)
                .studentCount(enrollmentRepository.countByClassroom(classroom))
                .createdAt(classroom.getCreatedAt())
                .build();
    }
}
