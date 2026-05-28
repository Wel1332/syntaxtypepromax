package com.syntaxtype.demo.features.user.service;

import com.syntaxtype.demo.features.user.dto.UserDTO;
import com.syntaxtype.demo.features.user.dto.TeacherDTO;
import com.syntaxtype.demo.features.user.entity.Teacher;
import com.syntaxtype.demo.features.user.entity.User;
import com.syntaxtype.demo.features.user.repository.TeacherRepository;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TeacherService {
    private final TeacherRepository teacherRepository;
    private final UserService userService; // Inject UserService

    public List<TeacherDTO> findAll() {
        return teacherRepository.findAll().stream()
                .map(this::convertToDTO)
                .toList();
    }

    public Optional<TeacherDTO> findByTeacherId(Long teacherId) {
        return teacherRepository.findById(teacherId)
                .map(this::convertToDTO);
    }

    public Optional<TeacherDTO> findByUser(User user) {
        return teacherRepository.findByUser(user)
                .map(this::convertToDTO);
    }

    public List<TeacherDTO> findByFirstName(String firstName) {
        return teacherRepository.findByFirstName(firstName).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<TeacherDTO> findByLastName(String lastName) {
        return teacherRepository.findByLastName(lastName).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<TeacherDTO> findByInstitution(String institution) {
        return teacherRepository.findByInstitution(institution).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<TeacherDTO> findBySubject(String subject) {
        return teacherRepository.findBySubject(subject).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public Optional<TeacherDTO> findByUserId(Long userId) {
        return teacherRepository.findByUser_UserId(userId)
                .map(this::convertToDTO);
    }

    public TeacherDTO save(TeacherDTO teacherDTO, User user) {
        Teacher teacher = convertFromDTO(teacherDTO, user);
        return convertToDTO(teacherRepository.save(teacher));
    }

    // PATCH: Update teacher's first name
    public TeacherDTO updateFirstName(Long teacherId, String newFirstName) {
        Optional<Teacher> teacherOpt = teacherRepository.findById(teacherId);
        if (teacherOpt.isPresent()) {
            Teacher teacher = teacherOpt.get();
            teacher.setFirstName(newFirstName);
            return convertToDTO(teacherRepository.save(teacher));
        }
        return null;
    }

    // PATCH: Update teacher's last name
    public TeacherDTO updateLastName(Long teacherId, String newLastName) {
        Optional<Teacher> teacherOpt = teacherRepository.findById(teacherId);
        if (teacherOpt.isPresent()) {
            Teacher teacher = teacherOpt.get();
            teacher.setLastName(newLastName);
            return convertToDTO(teacherRepository.save(teacher));
        }
        return null;
    }

    // PATCH: Update teacher's institution
    public TeacherDTO updateInstitution(Long teacherId, String newInstitution) {
        Optional<Teacher> teacherOpt = teacherRepository.findById(teacherId);
        if (teacherOpt.isPresent()) {
            Teacher teacher = teacherOpt.get();
            teacher.setInstitution(newInstitution);
            return convertToDTO(teacherRepository.save(teacher));
        }
        return null;
    }

    // PATCH: Update teacher's subject
    public TeacherDTO updateSubject(Long teacherId, String newSubject) {
        Optional<Teacher> teacherOpt = teacherRepository.findById(teacherId);
        if (teacherOpt.isPresent()) {
            Teacher teacher = teacherOpt.get();
            teacher.setSubject(newSubject);
            return convertToDTO(teacherRepository.save(teacher));
        }
        return null;
    }

    public void deleteById(Long teacherId) {
        teacherRepository.deleteById(teacherId);
    }

    public TeacherDTO convertToDTO(Teacher teacher) {
        if (teacher == null) return null;

        UserDTO userDTO = null;
        if (teacher.getUser() != null) {
            userDTO = userService.convertToDTO(teacher.getUser());
            if (userDTO != null) {
                userDTO.setPassword(null); // Ensure password is not sent to frontend
            }
        }
        return TeacherDTO.builder()
                .teacherId(teacher.getTeacherId())
                .user(userDTO)
                .firstName(teacher.getFirstName())
                .lastName(teacher.getLastName())
                .institution(teacher.getInstitution())
                .subject(teacher.getSubject())
                .build();
    }

    public Teacher convertFromDTO(TeacherDTO teacherDTO, User user) {
        if (teacherDTO == null) return null;
        Teacher teacher = new Teacher();
        teacher.setTeacherId(teacherDTO.getTeacherId());
        teacher.setUser(user);
        teacher.setFirstName(teacherDTO.getFirstName());
        teacher.setLastName(teacherDTO.getLastName());
        teacher.setInstitution(teacherDTO.getInstitution());
        teacher.setSubject(teacherDTO.getSubject());
        return teacher;
    }
}