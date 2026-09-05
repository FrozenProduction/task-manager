package com.frozenproduction.taskmanager.controller;

import com.frozenproduction.taskmanager.dto.CreateProjectRequest;
import com.frozenproduction.taskmanager.dto.ProjectDto;
import com.frozenproduction.taskmanager.service.ProjectService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    @Autowired
    private ProjectService projectService;

    @PostMapping
    public ResponseEntity<ProjectDto> createProject(@Valid @RequestBody CreateProjectRequest request) {
        Long userId = getCurrentUserId();
        ProjectDto project = projectService.createProject(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(project);
    }

    @GetMapping
    public ResponseEntity<List<ProjectDto>> getProjects() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(projectService.getProjectsByUser(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectDto> getProject(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(projectService.getProjectById(id, userId));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ProjectDto> updateProject(
            @PathVariable Long id,
            @Valid @RequestBody CreateProjectRequest request) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(projectService.updateProject(id, request, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        projectService.deleteProject(id, userId);
        return ResponseEntity.noContent().build();
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        // Extract user ID from security context (stored as credentials)
        if (auth.getCredentials() instanceof Long) {
            return (Long) auth.getCredentials();
        }
        throw new RuntimeException("User ID not found in security context");
    }
}
