package com.frozenproduction.taskmanager.service;

import com.frozenproduction.taskmanager.dto.*;
import com.frozenproduction.taskmanager.entity.User;
import com.frozenproduction.taskmanager.exception.ApiException;
import com.frozenproduction.taskmanager.repository.UserRepository;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private com.frozenproduction.taskmanager.security.JwtUtil jwtUtil;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ApiException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ApiException("Email already exists");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .build();

        user = userRepository.save(user);

        String token = jwtUtil.generateToken(user.getUsername(), user.getId());
        return AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .email(user.getEmail())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ApiException("Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new ApiException("Invalid username or password");
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getId());
        return AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .email(user.getEmail())
                .build();
    }

    public UserProfileDto getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("User not found"));
        return toProfileDto(user);
    }

    /**
     * Update the current user's username/email/password.
     * Always re-issues a JWT so the token's username claim matches the
     * new value (the existing JWT filter reads username from there).
     * Returns the profile + the new token so the frontend can update
     * localStorage in one round-trip.
     */
    @Transactional
    public UpdateProfileResult updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("User not found"));

        // currentPassword is REQUIRED to prove the caller owns the account.
        // @NotBlank on the DTO catches missing/blank at the boundary (400);
        // this check guards against a whitespace-only password that passed validation.
        if (request.getCurrentPassword() == null || request.getCurrentPassword().isBlank()) {
            throw new ApiException("Current password is required");
        }
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new ApiException("Current password is incorrect");
        }

        boolean changingUsername = request.getUsername() != null
                && !request.getUsername().isBlank()
                && !request.getUsername().equals(user.getUsername());
        boolean changingEmail = request.getEmail() != null
                && !request.getEmail().isBlank()
                && !request.getEmail().equals(user.getEmail());
        boolean changingPassword = request.getNewPassword() != null
                && !request.getNewPassword().isBlank();

        if (!changingUsername && !changingEmail && !changingPassword) {
            throw new ApiException("No changes to apply");
        }

        if (changingUsername) {
            if (userRepository.existsByUsername(request.getUsername())) {
                throw new ApiException("Username already exists");
            }
            user.setUsername(request.getUsername().trim());
        }
        if (changingEmail) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new ApiException("Email already exists");
            }
            user.setEmail(request.getEmail().trim().toLowerCase());
        }
        if (changingPassword) {
            user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        }

        user = userRepository.save(user);
        String newToken = jwtUtil.generateToken(user.getUsername(), user.getId());

        return new UpdateProfileResult(toProfileDto(user), newToken);
    }

    private UserProfileDto toProfileDto(User user) {
        return UserProfileDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    /** Profile + refreshed token returned by PATCH /api/auth/me. */
    @Data
    @AllArgsConstructor
    public static class UpdateProfileResult {
        private final UserProfileDto profile;
        private final String token;
    }
}
