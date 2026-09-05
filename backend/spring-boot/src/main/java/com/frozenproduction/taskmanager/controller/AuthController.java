package com.frozenproduction.taskmanager.controller;

import com.frozenproduction.taskmanager.dto.AuthResponse;
import com.frozenproduction.taskmanager.dto.LoginRequest;
import com.frozenproduction.taskmanager.dto.RegisterRequest;
import com.frozenproduction.taskmanager.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

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
}
