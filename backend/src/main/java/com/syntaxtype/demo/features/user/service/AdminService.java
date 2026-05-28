package com.syntaxtype.demo.features.user.service;

import com.syntaxtype.demo.features.user.dto.AdminDTO;
import com.syntaxtype.demo.features.user.dto.StudentDTO;
import com.syntaxtype.demo.features.user.entity.Admin;
import com.syntaxtype.demo.features.user.entity.Student;
import com.syntaxtype.demo.features.user.entity.User;
import com.syntaxtype.demo.features.user.repository.AdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AdminService {
    private final AdminRepository adminRepository;

    public List<AdminDTO> findAll() {
        return adminRepository.findAll().stream()
                .map(this::convertToDTO)
                .toList();
    }

    public Optional<AdminDTO> findByAdminId(Long adminId) {
        return adminRepository.findById(adminId)
                .map(this::convertToDTO);
    }

    public Optional<AdminDTO> findByUser(User user) {
        return adminRepository.findByUser(user)
                .map(this::convertToDTO);
    }

    public List<AdminDTO> findByFirstName(String firstName) {
        return adminRepository.findByFirstName(firstName).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<AdminDTO> findByLastName(String lastName) {
        return adminRepository.findByLastName(lastName).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public Optional<AdminDTO> findByUserId(Long userId) {
        return adminRepository.findByUser_UserId(userId)
                .map(this::convertToDTO);
    }

    public AdminDTO save(AdminDTO adminDTO, User user) {
        Admin admin = convertFromDTO(adminDTO, user);
        return convertToDTO(adminRepository.save(admin));
    }

    // PATCH: Update admin's first name
    public AdminDTO updateFirstName(Long adminId, String newFirstName) {
        Optional<Admin> adminOpt = adminRepository.findById(adminId);
        if (adminOpt.isPresent()) {
            Admin admin = adminOpt.get();
            admin.setFirstName(newFirstName);
            return convertToDTO(adminRepository.save(admin));
        }
        return null;
    }

    // PATCH: Update admin's last name
    public AdminDTO updateLastName(Long adminId, String newLastName) {
        Optional<Admin> adminOpt = adminRepository.findById(adminId);
        if (adminOpt.isPresent()) {
            Admin admin = adminOpt.get();
            admin.setLastName(newLastName);
            return convertToDTO(adminRepository.save(admin));
        }
        return null;
    }

    public void deleteById(Long adminId) {
        adminRepository.deleteById(adminId);
    }

    public AdminDTO convertToDTO(Admin admin) {
        if (admin == null) return null;
        return AdminDTO.builder()
                .adminId(admin.getAdminId())
                .userId(admin.getUser() != null ? admin.getUser().getUserId() : null)
                .firstName(admin.getFirstName())
                .lastName(admin.getLastName())
                .build();
    }

    public Admin convertFromDTO(AdminDTO adminDTO, User user) {
        if (adminDTO == null) return null;
        Admin admin = new Admin();
        admin.setAdminId(adminDTO.getAdminId());
        admin.setUser(user);
        admin.setFirstName(adminDTO.getFirstName());
        admin.setLastName(adminDTO.getLastName());
        return admin;
    }
}