package com.frozenproduction.taskmanager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Dashboard metrics — single cheap call instead of fetching every task.
 * Returned by GET /api/tasks/stats.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskStatsDto {
    private long total;
    private long todo;
    private long inProgress;
    private long done;
}
