package com.frozenproduction.taskmanager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

/**
 * Public-facing user profile — never includes the password hash.
 * Returned by GET /api/auth/me and PATCH /api/auth/me.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDto {
    private Long id;
    private String username;
    private String email;
    private Instant createdAt;
    private Instant updatedAt;
}
