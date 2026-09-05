package com.frozenproduction.taskmanager.service;

import com.frozenproduction.taskmanager.dto.*;
import com.frozenproduction.taskmanager.entity.Task;
import com.frozenproduction.taskmanager.entity.Task.Status;
import com.frozenproduction.taskmanager.entity.User;
import com.frozenproduction.taskmanager.entity.Project;
import com.frozenproduction.taskmanager.repository.ProjectRepository;
import com.frozenproduction.taskmanager.repository.TaskRepository;
import com.frozenproduction.taskmanager.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TaskService {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public TaskDto createTask(CreateTaskRequest request, Long userId) {
        // Verify project ownership
        var project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found"));

        if (!project.getOwner().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .status(request.getStatus() != null ? request.getStatus() : Status.TODO)
                .project(project)
                .build();

        if (request.getAssigneeId() != null) {
            User assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new RuntimeException("Assignee not found"));
            task.setAssignee(assignee);
        }

        task = taskRepository.save(task);
        return toDto(task);
    }

    public List<TaskDto> getTasksByProject(Long projectId, Long userId) {
        var project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        if (!project.getOwner().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        return taskRepository.findByProjectIdOrderByCreatedAtDesc(projectId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public TaskDto getTaskById(Long taskId, Long userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (!task.getProject().getOwner().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        return toDto(task);
    }

    @Transactional
    public TaskDto updateTask(Long taskId, UpdateTaskRequest request, Long userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (!task.getProject().getOwner().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        if (request.getTitle() != null) {
            task.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            task.setDescription(request.getDescription());
        }
        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
        }
        if (request.getAssigneeId() != null) {
            User assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new RuntimeException("Assignee not found"));
            task.setAssignee(assignee);
        }

        task = taskRepository.save(task);
        return toDto(task);
    }

    @Transactional
    public void deleteTask(Long taskId, Long userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (!task.getProject().getOwner().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        taskRepository.delete(task);
    }

    public List<TaskDto> getTasksByAssignee(Long userId) {
        return taskRepository.findByAssigneeId(userId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private TaskDto toDto(Task task) {
        Project project = task.getProject();
        User assignee = task.getAssignee();
        return TaskDto.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus())
                .projectId(project.getId())
                .projectName(project.getName())
                .assigneeId(assignee != null ? assignee.getId() : null)
                .assigneeUsername(assignee != null ? assignee.getUsername() : null)
                .createdAt(task.getCreatedAt() != null ? task.getCreatedAt().toString() : null)
                .updatedAt(task.getUpdatedAt() != null ? task.getUpdatedAt().toString() : null)
                .build();
    }
}
