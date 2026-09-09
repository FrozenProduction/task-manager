package com.frozenproduction.taskmanager.dto;

import com.frozenproduction.taskmanager.entity.Task.Status;
import lombok.Data;

@Data
public class UpdateTaskRequest {
    private String title;
    private String description;
    private Status status;
    private Long assigneeId;
}
