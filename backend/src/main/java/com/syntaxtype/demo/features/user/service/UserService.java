package com.syntaxtype.demo.features.user.service;

import com.syntaxtype.demo.core.security.CustomUserDetails;
import com.syntaxtype.demo.core.security.JwtUtil;
import com.syntaxtype.demo.features.user.entity.User;
import com.syntaxtype.demo.core.enums.Role;
import com.syntaxtype.demo.features.user.repository.UserRepository;
import com.syntaxtype.demo.features.user.dto.UserDTO;
import com.syntaxtype.demo.features.user.dto.requests.TempTeacherUpdate;
import com.syntaxtype.demo.features.user.dto.responses.AccountSetupResponse;
import com.syntaxtype.demo.core.exception.UsernameConflictException; // Corrected package name
import com.syntaxtype.demo.features.user.repository.StudentRepository;
import com.syntaxtype.demo.features.user.repository.TeacherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;


    public List<UserDTO> findAll() {
        List<User> users = userRepository.findAll();
        return users.stream().map(this::convertToDTO).toList();
    }

    public Optional<UserDTO> findByUserId(Long userId) {
        return userRepository.findByUserId(userId).map(this::convertToDTO);
    }

    public Optional<User> findUserEntityById(Long userId) {
        return userRepository.findByUserId(userId);
    }


    public Optional<UserDTO> findByUsername(String username) {
        return userRepository.findByUsername(username).map(this::convertToDTO);
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }

    public List<UserDTO> findByUserRole(Role userRole) {
        return userRepository.findByUserRole(userRole).stream().map(this::convertToDTO).toList();
    }

    public List<UserDTO> findByIsTempPassword(boolean isTempPassword) {
        return userRepository.findByIsTempPassword(isTempPassword).stream().map(this::convertToDTO).toList();
    }

    public List<UserDTO> findByCreatedAt(LocalDateTime createdAt) {
        return userRepository.findByCreatedAt(createdAt).stream().map(this::convertToDTO).toList();
    }

    public UserDTO save(UserDTO userDTO) {
        User user = convertFromDTO(userDTO);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return convertToDTO(userRepository.save(user));
    }

    public UserDTO saveUserWithUserRole(UserDTO userDTO) {
        User user = convertFromDTO(userDTO);
        user.setUserRole(Role.USER);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return convertToDTO(userRepository.save(user));
    }

    public UserDTO saveUserWithAdminRole(UserDTO userDTO) {
        User user = convertFromDTO(userDTO);
        user.setUserRole(Role.ADMIN);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return convertToDTO(userRepository.save(user));
    }

    public UserDTO saveUserWithTeacherRole(UserDTO userDTO) {
        User user = convertFromDTO(userDTO);
        user.setUserRole(Role.TEACHER);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return convertToDTO(userRepository.save(user));
    }

    public UserDTO saveUserWithStudentRole(UserDTO userDTO) {
        User user = convertFromDTO(userDTO);
        user.setUserRole(Role.STUDENT);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return convertToDTO(userRepository.save(user));
    }

    public UserDTO updateEmail(Long userId, String newEmail) {
        Optional<User> userOpt = userRepository.findByUserId(userId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setEmail(newEmail);
            return convertToDTO(userRepository.save(user));
        }
        return null;
    }

    public UserDTO updatePassword(Long userId, String newPassword) {
        Optional<User> userOpt = userRepository.findByUserId(userId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setPassword(passwordEncoder.encode(newPassword));
            return convertToDTO(userRepository.save(user));
        }
        return null;
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteById(Long id) {
        // Fetch the user to check their role and ensure they exist
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("User not found with ID: " + id));

        // Based on the user's role, delete the associated profile first
        // This assumes Student and Teacher entities use the User's ID as their own ID via @MapsId
        if (user.getUserRole() == Role.STUDENT) {
            if (studentRepository.existsById(id)) {
                studentRepository.deleteById(id);
            }
        } else if (user.getUserRole() == Role.TEACHER) {
            if (teacherRepository.existsById(id)) {
                teacherRepository.deleteById(id);
            }
        }
        // Other roles like ADMIN or generic USER might not have these specific profiles,
        // so no specific profile deletion is needed for them here.

        userRepository.deleteById(id); // Finally, delete the user
    }

    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public AccountSetupResponse updateTempTeacher(Long userIdFromPath, TempTeacherUpdate updateRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails)) {
            throw new AccessDeniedException("User not authenticated properly.");
        }

        CustomUserDetails authenticatedUserDetails = (CustomUserDetails) authentication.getPrincipal();
        User authenticatedUserEntity = authenticatedUserDetails.getUser(); // Assuming CustomUserDetails has getUser()

        if (!userIdFromPath.equals(authenticatedUserEntity.getUserId())) {
            throw new AccessDeniedException("User not authorized to update this account.");
        }

        User userToUpdate = userRepository.findByUserId(userIdFromPath)
                .orElseThrow(() -> new java.util.NoSuchElementException("User not found with ID: " + userIdFromPath));

        if (userToUpdate.getUserRole() != Role.TEACHER) {
            throw new AccessDeniedException("This operation is only allowed for users with the TEACHER role.");
        }

        if (!userToUpdate.isTempPassword()) {
            throw new IllegalStateException("Account setup has already been completed or is not required for this user.");
        }

        // Update username if provided and different
        if (updateRequest.getUsername() != null && !updateRequest.getUsername().isEmpty() && !updateRequest.getUsername().equals(userToUpdate.getUsername())) {
            if (userRepository.existsByUsername(updateRequest.getUsername())) {
                throw new UsernameConflictException("Username '" + updateRequest.getUsername() + "' is already taken.");
            }
            userToUpdate.setUsername(updateRequest.getUsername());
        }

        // Update password if provided
        if (updateRequest.getPassword() != null && !updateRequest.getPassword().isEmpty()) {
            userToUpdate.setPassword(passwordEncoder.encode(updateRequest.getPassword()));
        }

        userToUpdate.setTempPassword(false);
        User savedUser = userRepository.save(userToUpdate);

        // Generate a new token with updated claims (isTempPassword = false)
        String newToken = jwtUtil.generateToken(savedUser.getUsername(), savedUser.getUserRole().toString(), savedUser.getUserId(), savedUser.isTempPassword());
        return new AccountSetupResponse(newToken, convertToDTO(savedUser));
    }

    public UserDTO convertToDTO(User user) {
        if (user == null) return null;

        return UserDTO.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .email(user.getEmail())
                .password(null) // Ensure password is not sent to frontend
                .userRole(user.getUserRole())
                .isTempPassword(user.isTempPassword())
                .createdAt(user.getCreatedAt())
                .build();
    }

    public User convertFromDTO(UserDTO userDTO) {
        if (userDTO == null) return null;

        User user = new User();

        user.setUserId(userDTO.getUserId());
        user.setUsername(userDTO.getUsername());
        user.setEmail(userDTO.getEmail());

        if (userDTO.getPassword() != null && !userDTO.getPassword().isBlank()) {
            user.setPassword(userDTO.getPassword());
        }

        if (user.getUserRole() == null && userDTO.getUserRole() != null) {
            user.setUserRole(userDTO.getUserRole());
        }
        user.setTempPassword(userDTO.isTempPassword());
        user.setCreatedAt(userDTO.getCreatedAt());

        return user;
    }
}