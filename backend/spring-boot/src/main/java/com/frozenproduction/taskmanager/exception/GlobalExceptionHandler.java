package com.frozenproduction.taskmanager.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.util.stream.Collectors;

/**
 * Maps ApiException → its embedded status (400 default, 403 for
 * access-denied) and Bean Validation errors → HTTP 400.
 * Body is plain text (matches what the existing frontend expects when
 * it calls response.text() on errors).
 *
 * Deliberately does NOT catch generic RuntimeException: those represent
 * genuine server bugs (DB connection lost, NPE, etc.) and should
 * propagate as 500 so they're noticed.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<String> handleApi(ApiException ex) {
        return ResponseEntity.status(ex.getStatus())
                .contentType(MediaType.TEXT_PLAIN)
                .body(ex.getMessage() != null ? ex.getMessage() : "Request failed");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<String> handleValidation(MethodArgumentNotValidException ex) {
        // Aggregate field errors so the frontend can show them all.
        String details = ex.getBindingResult().getFieldErrors().stream()
                .map(f -> f.getField() + ": " + f.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .contentType(MediaType.TEXT_PLAIN)
                .body(details.isBlank() ? "Validation failed" : details);
    }
}
