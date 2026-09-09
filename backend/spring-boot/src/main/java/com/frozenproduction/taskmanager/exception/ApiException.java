package com.frozenproduction.taskmanager.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown for client-fixable errors (validation failures, duplicate username,
 * wrong password, not-found, access-denied). Mapped by GlobalExceptionHandler
 * to the embedded status with a plain-text body (the frontend reads
 * response.text(), so no JSON envelope).
 *
 * Use this INSTEAD of raw RuntimeException for any error the user should
 * see a message about. Genuine server bugs (DB down, NPE) should still be
 * raw RuntimeException — those propagate as 500.
 */
public class ApiException extends RuntimeException {
    private final HttpStatus status;

    public ApiException(String message) {
        this(message, HttpStatus.BAD_REQUEST);
    }

    public ApiException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
