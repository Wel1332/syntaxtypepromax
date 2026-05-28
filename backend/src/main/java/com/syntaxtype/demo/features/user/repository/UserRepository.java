package com.syntaxtype.demo.features.user.repository;

import com.syntaxtype.demo.features.user.entity.User;
import com.syntaxtype.demo.core.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUserId(Long userId);
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByPassword(String password);
    List<User> findByUserRole(Role userRole);
    List<User> findByIsTempPassword(boolean isTempPassword);
    List<User> findByCreatedAt(LocalDateTime createdAt);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
}