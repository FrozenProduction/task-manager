package com.frozenproduction.taskmanager.dto;

import com.frozenproduction.taskmanager.entity.Task.Status;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateTaskRequest {
    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must be at most 200 characters")
    private String title;

    @Size(max = 2000, message = "Description must be at most 2000 characters")
    private String description;

    @NotNull(message = "Status is required")
    private Status status;

    @NotNull(message = "Project ID is required")
    private Long projectId;

    private Long assigneeId;
}
