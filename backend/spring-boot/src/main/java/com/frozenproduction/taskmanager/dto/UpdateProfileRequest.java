package com.frozenproduction.taskmanager.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * PATCH /api/auth/me body.
 *
 * - username: optional, 3-50 chars if changing
 * - email: optional, must be a valid email if changing
 * - currentPassword: REQUIRED — verifies the user is really the account owner.
 *                    @NotBlank so a missing value is rejected at the boundary
 *                    (HTTP 400) instead of bubbling up as 500 from the service.
 * - newPassword: optional, 6-100 chars, requires currentPassword to be valid
 *
 * At least one of username/email/newPassword must also be present (checked in service).
 */
@Data
public class UpdateProfileRequest {

    @Size(min = 3, max = 50, message = "Username must be 3-50 characters")
    private String username;

    @Email(message = "Email must be valid")
    @Size(max = 100, message = "Email must be at most 100 characters")
    private String email;

    @NotBlank(message = "Current password is required")
    private String currentPassword;

    @Size(min = 6, max = 100, message = "New password must be 6-100 characters")
    private String newPassword;
}
