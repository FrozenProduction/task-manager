package com.frozenproduction.taskmanager.dto;

import com.frozenproduction.taskmanager.entity.Task.Status;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskDto {
    private Long id;
    private String title;
    private String description;
    private Status status;
    private Long projectId;
    private String projectName;
    private Long assigneeId;
    private String assigneeUsername;
    private String createdAt;
    private String updatedAt;
}
