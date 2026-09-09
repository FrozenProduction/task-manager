package com.frozenproduction.taskmanager.controller;

import com.frozenproduction.taskmanager.dto.AuthResponse;
import com.frozenproduction.taskmanager.dto.LoginRequest;
import com.frozenproduction.taskmanager.dto.RegisterRequest;
import com.frozenproduction.taskmanager.dto.UpdateProfileRequest;
import com.frozenproduction.taskmanager.dto.UserProfileDto;
import com.frozenproduction.taskmanager.service.AuthService;
import com.frozenproduction.taskmanager.service.AuthService.UpdateProfileResult;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileDto> me() {
        return ResponseEntity.ok(authService.getProfile(getCurrentUserId()));
    }

    @PatchMapping("/me")
    public ResponseEntity<AuthResponse> updateMe(@Valid @RequestBody UpdateProfileRequest request) {
        UpdateProfileResult result = authService.updateProfile(getCurrentUserId(), request);
        // Reuse AuthResponse shape — token + identity in one shot so the
        // frontend can refresh localStorage without a separate login.
        AuthResponse body = AuthResponse.builder()
                .token(result.getToken())
                .username(result.getProfile().getUsername())
                .email(result.getProfile().getEmail())
                .build();
        return ResponseEntity.ok(body);
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getCredentials() instanceof Long) {
            return (Long) auth.getCredentials();
        }
        throw new RuntimeException("User ID not found in security context");
    }
}
