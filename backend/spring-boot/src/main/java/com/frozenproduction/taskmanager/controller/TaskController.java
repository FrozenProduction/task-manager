package com.frozenproduction.taskmanager.controller;

import com.frozenproduction.taskmanager.dto.CreateTaskRequest;
import com.frozenproduction.taskmanager.dto.TaskDto;
import com.frozenproduction.taskmanager.dto.UpdateTaskRequest;
import com.frozenproduction.taskmanager.dto.ProjectDto;
import com.frozenproduction.taskmanager.service.ProjectService;
import com.frozenproduction.taskmanager.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    @Autowired
    private TaskService taskService;

    @Autowired
    private ProjectService projectService;

    @PostMapping
    public ResponseEntity<TaskDto> createTask(@Valid @RequestBody CreateTaskRequest request) {
        Long userId = getCurrentUserId();
        TaskDto task = taskService.createTask(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(task);
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<TaskDto>> getTasksByProject(@PathVariable Long projectId) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(taskService.getTasksByProject(projectId, userId));
    }

    @GetMapping("/mine")
    public ResponseEntity<List<TaskDto>> getMyTasks() {
        Long userId = getCurrentUserId();
        // Correct dashboard metric: all tasks in all projects owned by this user.
        List<ProjectDto> projects = projectService.getProjectsByUser(userId);
        List<TaskDto> all = new java.util.ArrayList<>();
        for (ProjectDto p : projects) {
            all.addAll(taskService.getTasksByProject(p.getId(), userId));
        }
        return ResponseEntity.ok(all);
    }

    @GetMapping("/assigned")
    public ResponseEntity<List<TaskDto>> getAssignedTasks() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(taskService.getTasksByAssignee(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskDto> getTask(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(taskService.getTaskById(id, userId));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<TaskDto> updateTask(
            @PathVariable Long id,
            @RequestBody UpdateTaskRequest request) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(taskService.updateTask(id, request, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        taskService.deleteTask(id, userId);
        return ResponseEntity.noContent().build();
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth.getCredentials() instanceof Long) {
            return (Long) auth.getCredentials();
        }
        throw new RuntimeException("User ID not found in security context");
    }
}
