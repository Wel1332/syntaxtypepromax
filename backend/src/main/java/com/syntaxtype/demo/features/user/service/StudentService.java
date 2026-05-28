package com.syntaxtype.demo.features.user.service;

import com.syntaxtype.demo.features.user.dto.StudentDTO;
import com.syntaxtype.demo.features.user.dto.UserDTO;
import com.syntaxtype.demo.features.user.entity.Student;
import com.syntaxtype.demo.features.user.entity.User;
import com.syntaxtype.demo.features.user.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // Import Transactional

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class StudentService {
    private final StudentRepository studentRepository;
    private final UserService userService; // Inject UserService

    public List<StudentDTO> findAll() {
        return studentRepository.findAll().stream()
                .map(this::convertToDTO)
                .toList();
    }

    public Optional<StudentDTO> findByStudentId(Long studentId) {
        return studentRepository.findById(studentId)
                .map(this::convertToDTO);
    }

    public Optional<StudentDTO> findByUser(User user) {
        return studentRepository.findByUser(user)
                .map(this::convertToDTO);
    }

    public List<StudentDTO> findByFirstName(String firstName) {
        return studentRepository.findByFirstName(firstName).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<StudentDTO> findByLastName(String lastName) {
        return studentRepository.findByLastName(lastName).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<StudentDTO> findByUniversityEmail(String universityEmail) {
        return studentRepository.findByUniversityEmail(universityEmail).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<StudentDTO> findByCourse(String course) {
        return studentRepository.findByCourse(course).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<StudentDTO> findByYearLevel(String yearLevel) {
        return studentRepository.findByYearLevel(yearLevel).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<StudentDTO> findByClassName(String className) {
        return studentRepository.findByClassName(className).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<StudentDTO> findBySection(String section) {
        return studentRepository.findBySection(section).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public Optional<StudentDTO> findByUserId(Long userId) {
        return studentRepository.findByUser_UserId(userId)
                .map(this::convertToDTO);
    }

    public StudentDTO save(StudentDTO studentDTO, User user) {
        Student student = convertFromDTO(studentDTO, user);
        return convertToDTO(studentRepository.save(student));
    }

    // PATCH: Update student's first name
    public StudentDTO updateFirstName(Long studentId, String newFirstName) {
        Optional<Student> studentOpt = studentRepository.findById(studentId);
        if (studentOpt.isPresent()) {
            Student student = studentOpt.get();
            student.setFirstName(newFirstName);
            return convertToDTO(studentRepository.save(student));
        }
        return null;
    }

    // PATCH: Update student's last name
    public StudentDTO updateLastName(Long studentId, String newLastName) {
        Optional<Student> studentOpt = studentRepository.findById(studentId);
        if (studentOpt.isPresent()) {
            Student student = studentOpt.get();
            student.setLastName(newLastName);
            return convertToDTO(studentRepository.save(student));
        }
        return null;
    }

    // PATCH: Update student's university email
    public StudentDTO updateUniversityEmail(Long studentId, String newUniversityEmail) {
        Optional<Student> studentOpt = studentRepository.findById(studentId);
        if (studentOpt.isPresent()) {
            Student student = studentOpt.get();
            student.setUniversityEmail(newUniversityEmail);
            return convertToDTO(studentRepository.save(student));
        }
        return null;
    }

    // PATCH: Update student's course
    public StudentDTO updateCourse(Long studentId, String newCourse) {
        Optional<Student> studentOpt = studentRepository.findById(studentId);
        if (studentOpt.isPresent()) {
            Student student = studentOpt.get();
            student.setCourse(newCourse);
            return convertToDTO(studentRepository.save(student));
        }
        return null;
    }

    // PATCH: Update student's year level
    public StudentDTO updateYearLevel(Long studentId, String newYearLevel) {
        Optional<Student> studentOpt = studentRepository.findById(studentId);
        if (studentOpt.isPresent()) {
            Student student = studentOpt.get();
            student.setYearLevel(newYearLevel);
            return convertToDTO(studentRepository.save(student));
        }
        return null;
    }

    // PATCH: Update student's class name
    public StudentDTO updateClassName(Long studentId, String newClassName) {
        Optional<Student> studentOpt = studentRepository.findById(studentId);
        if (studentOpt.isPresent()) {
            Student student = studentOpt.get();
            student.setClassName(newClassName);
            return convertToDTO(studentRepository.save(student));
        }
        return null;
    }

    // PATCH: Update student's section
    public StudentDTO updateSection(Long studentId, String newSection) {
        Optional<Student> studentOpt = studentRepository.findById(studentId);
        if (studentOpt.isPresent()) {
            Student student = studentOpt.get();
            student.setSection(newSection);
            return convertToDTO(studentRepository.save(student));
        }
        return null;
    }

    public void deleteById(Long studentId) {
        studentRepository.deleteById(studentId);
    }

    // NEW: Delete by User ID
    @Transactional // Ensure this operation is transactional
    public void deleteByUserId(Long userId) {
        studentRepository.deleteByUser_UserId(userId); // You will need to add this method to StudentRepository
    }


    public StudentDTO convertToDTO(Student student) {
        if (student == null) return null;

        UserDTO userDTO = null;
        if (student.getUser() != null) {
            userDTO = userService.convertToDTO(student.getUser());
            if (userDTO != null) {
                userDTO.setPassword(null); // Ensure password is not sent to frontend
            }
        }
        return StudentDTO.builder()
                .studentId(student.getStudentId())
                .user(userDTO)
                .firstName(student.getFirstName())
                .lastName(student.getLastName())
                .universityEmail(student.getUniversityEmail())
                .course(student.getCourse())
                .yearLevel(student.getYearLevel())
                .className(student.getClassName())
                .section(student.getSection())
                .build();
    }

    public Student convertFromDTO(StudentDTO studentDTO, User user) {
        if (studentDTO == null) return null;

        Student student = new Student();
        student.setStudentId(studentDTO.getStudentId());
        student.setUser(user);
        student.setFirstName(studentDTO.getFirstName());
        student.setLastName(studentDTO.getLastName());
        student.setUniversityEmail(studentDTO.getUniversityEmail());
        student.setCourse(studentDTO.getCourse());
        student.setYearLevel(studentDTO.getYearLevel());
        student.setClassName(studentDTO.getClassName());
        student.setSection(studentDTO.getSection());

        return student;
    }
}
