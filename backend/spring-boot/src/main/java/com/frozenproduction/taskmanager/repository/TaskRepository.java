package com.frozenproduction.taskmanager.repository;

import com.frozenproduction.taskmanager.entity.Task;
import com.frozenproduction.taskmanager.entity.Task.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByProjectId(Long projectId);
    List<Task> findByProjectIdOrderByCreatedAtDesc(Long projectId);
    List<Task> findByAssigneeId(Long assigneeId);
    List<Task> findByStatus(Status status);
}
