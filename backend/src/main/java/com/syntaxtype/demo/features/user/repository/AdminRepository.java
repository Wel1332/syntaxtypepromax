package com.syntaxtype.demo.features.user.repository;

import com.syntaxtype.demo.features.user.entity.Admin;
import com.syntaxtype.demo.features.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface AdminRepository extends JpaRepository<Admin, Long> {
    Optional<Admin> findByUser(User user);
    List<Admin> findByFirstName(String firstName);
    List<Admin> findByLastName(String lastName);
    Optional<Admin> findByUser_UserId(Long userId);
}
