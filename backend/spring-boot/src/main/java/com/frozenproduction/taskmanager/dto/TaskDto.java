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

    // Link-Logger snapshot (null when the task wasn't created from a link).
    // `sourceLinkShortUrl` is the public short URL reconstructed from
    // LINK_LOGGER_PUBLIC_BASE_URL + sourceLinkShortCode; kept on the DTO so
    // the frontend doesn't have to know how to assemble it.
    private String sourceLinkShortCode;
    private String sourceLinkUrl;
    private String sourceLinkShortUrl;
    private Integer sourceLinkClicksAtImport;
}
