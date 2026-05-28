package com.syntaxtype.demo.features.auth.controller;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

import com.syntaxtype.demo.core.security.JwtResponse;
import com.syntaxtype.demo.core.security.JwtUtil;
import com.syntaxtype.demo.features.user.dto.UserDTO;
import com.syntaxtype.demo.features.user.entity.User;
import com.syntaxtype.demo.features.user.service.UserService;

@ApiResponses(value = {
        @ApiResponse(responseCode = "400", description = "Bad request"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
})
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @PostMapping("/register")
    public ResponseEntity<UserDTO> registerUser(@RequestBody UserDTO userDTO) {
        if (userService.existsByUsername(userDTO.getUsername())) {
            return new ResponseEntity<>(HttpStatus.CONFLICT); // Username already exists
        }
        if (userService.existsByEmail(userDTO.getEmail())) {
            return new ResponseEntity<>(HttpStatus.CONFLICT); // Email already exists
        }
        UserDTO registeredUser = userService.saveUserWithUserRole(userDTO);
        return new ResponseEntity<>(registeredUser, HttpStatus.CREATED);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/register/admin")
    public ResponseEntity<UserDTO> registerAdmin(@RequestBody UserDTO userDTO) {
        if (userService.existsByUsername(userDTO.getUsername())) {
            return new ResponseEntity<>(HttpStatus.CONFLICT);
        }
        if (userService.existsByEmail(userDTO.getEmail())) {
            return new ResponseEntity<>(HttpStatus.CONFLICT);
        }
        UserDTO registeredUser = userService.saveUserWithAdminRole(userDTO);
        return new ResponseEntity<>(registeredUser, HttpStatus.CREATED);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/register/teacher")
    public ResponseEntity<UserDTO> registerTeacher(@RequestBody UserDTO userDTO) {
        if (userService.existsByUsername(userDTO.getUsername())) {
            return new ResponseEntity<>(HttpStatus.CONFLICT);
        }
        if (userService.existsByEmail(userDTO.getEmail())) {
            return new ResponseEntity<>(HttpStatus.CONFLICT);
        }
        UserDTO registeredUser = userService.saveUserWithTeacherRole(userDTO);
        return new ResponseEntity<>(registeredUser, HttpStatus.CREATED);
    }

    @PostMapping("/register/student")
    public ResponseEntity<UserDTO> registerStudent(@RequestBody UserDTO userDTO) {
        if (userService.existsByUsername(userDTO.getUsername())) {
            return new ResponseEntity<>(HttpStatus.CONFLICT);
        }
        if (userService.existsByEmail(userDTO.getEmail())) {
            return new ResponseEntity<>(HttpStatus.CONFLICT);
        }
        UserDTO registeredUser = userService.saveUserWithStudentRole(userDTO);
        return new ResponseEntity<>(registeredUser, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody UserDTO loginRequest) {
        User user = userService.findByEmail(loginRequest.getEmail());

        if (user != null) {
            if (passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
                // Ensure UserDTO has access to isTempPassword or fetch the User entity
                // For this example, assuming UserDTO has a getIsTempPassword() method
                // or you fetch the full User entity which has it.
                String token = jwtUtil.generateToken(user.getUsername(), user.getUserRole().toString(), user.getUserId(), user.isTempPassword());

                return ResponseEntity.ok(new JwtResponse(token));
            } else {
                return new ResponseEntity<>("Invalid credentials", HttpStatus.UNAUTHORIZED);
            }
        } else {
            return new ResponseEntity<>("Invalid credentials", HttpStatus.UNAUTHORIZED);
        }
    }
}
