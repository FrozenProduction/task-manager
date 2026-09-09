package com.frozenproduction.taskmanager.service;

import com.frozenproduction.taskmanager.dto.*;
import com.frozenproduction.taskmanager.entity.Task;
import com.frozenproduction.taskmanager.entity.Task.Status;
import com.frozenproduction.taskmanager.entity.User;
import com.frozenproduction.taskmanager.entity.Project;
import com.frozenproduction.taskmanager.exception.ApiException;
import org.springframework.http.HttpStatus;
import com.frozenproduction.taskmanager.repository.ProjectRepository;
import com.frozenproduction.taskmanager.repository.TaskRepository;
import com.frozenproduction.taskmanager.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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

    @Autowired
    private LinkLoggerClient linkLoggerClient;

    @Transactional
    public TaskDto createTask(CreateTaskRequest request, Long userId) {
        // Verify project ownership (using ApiException for clean 400s, matching
        // the rest of the a3b03db error-handling convention).
        var project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ApiException("Project not found"));

        if (!project.getOwner().getId().equals(userId)) {
            throw new ApiException("Access denied", HttpStatus.FORBIDDEN);
        }

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .status(request.getStatus() != null ? request.getStatus() : Status.TODO)
                .project(project)
                .build();

        if (request.getAssigneeId() != null) {
            User assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new ApiException("Assignee not found"));
            task.setAssignee(assignee);
        }

        // Link-Logger integration: when the request includes a linkLoggerLinkId,
        // fetch the link from Link Logger and snapshot its data onto the Task.
        // On any Link Logger failure, the user gets a 4xx/5xx via ApiException;
        // we do NOT silently create the task without the link — that would
        // surprise the user with a task that has no source data.
        if (request.getLinkLoggerLinkId() != null) {
            LinkLoggerLinkDto link = linkLoggerClient.fetchLink(request.getLinkLoggerLinkId());
            task.setSourceLinkShortCode(link.short_code());
            task.setSourceLinkUrl(link.original_url());
            task.setSourceLinkClicksAtImport(link.clicks());
            // If the user provided an empty title, fall back to the link's
            // host (or full URL truncated) so the task is still meaningful.
            if (task.getTitle() == null || task.getTitle().isBlank()) {
                task.setTitle(truncatedFromUrl(link.original_url(), 200));
            }
        }

        task = taskRepository.save(task);
        return toDto(task);
    }

    private static String truncatedFromUrl(String url, int max) {
        if (url == null) return "";
        return url.length() <= max ? url : url.substring(0, max - 1) + "…";
    }

    public List<TaskDto> getTasksByProject(Long projectId, Long userId) {
        var project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ApiException("Project not found"));

        if (!project.getOwner().getId().equals(userId)) {
            throw new ApiException("Access denied", HttpStatus.FORBIDDEN);
        }

        return taskRepository.findByProjectIdOrderByCreatedAtDesc(projectId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public TaskDto getTaskById(Long taskId, Long userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ApiException("Task not found"));

        if (!task.getProject().getOwner().getId().equals(userId)) {
            throw new ApiException("Access denied", HttpStatus.FORBIDDEN);
        }

        return toDto(task);
    }

    @Transactional
    public TaskDto updateTask(Long taskId, UpdateTaskRequest request, Long userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ApiException("Task not found"));

        if (!task.getProject().getOwner().getId().equals(userId)) {
            throw new ApiException("Access denied", HttpStatus.FORBIDDEN);
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
                    .orElseThrow(() -> new ApiException("Assignee not found"));
            task.setAssignee(assignee);
        }

        task = taskRepository.save(task);
        return toDto(task);
    }

    @Transactional
    public void deleteTask(Long taskId, Long userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ApiException("Task not found"));

        if (!task.getProject().getOwner().getId().equals(userId)) {
            throw new ApiException("Access denied", HttpStatus.FORBIDDEN);
        }

        taskRepository.delete(task);
    }

    public List<TaskDto> getTasksByAssignee(Long userId) {
        return taskRepository.findByAssigneeId(userId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Dashboard metrics: total + per-status counts in ONE query.
     * Replaces the prior client-side pattern that walked every project.
     */
    public TaskStatsDto getStatsForOwner(Long userId) {
        long todo = 0, inProgress = 0, done = 0;
        for (Object[] row : taskRepository.countByStatusForOwner(userId)) {
            Status s = (Status) row[0];
            long n = ((Number) row[1]).longValue();
            switch (s) {
                case TODO:        todo = n; break;
                case IN_PROGRESS: inProgress = n; break;
                case DONE:        done = n; break;
            }
        }
        long total = todo + inProgress + done;
        return TaskStatsDto.builder()
                .total(total)
                .todo(todo)
                .inProgress(inProgress)
                .done(done)
                .build();
    }

    private TaskDto toDto(Task task) {
        Project project = task.getProject();
        User assignee = task.getAssignee();
        TaskDto.TaskDtoBuilder b = TaskDto.builder()
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
                .sourceLinkShortCode(task.getSourceLinkShortCode())
                .sourceLinkUrl(task.getSourceLinkUrl())
                .sourceLinkClicksAtImport(task.getSourceLinkClicksAtImport());
        if (task.getSourceLinkShortCode() != null) {
            b.sourceLinkShortUrl(linkLoggerClient.publicShortUrl(task.getSourceLinkShortCode()));
        }
        return b.build();
    }
}
