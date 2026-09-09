package com.frozenproduction.taskmanager.repository;

import com.frozenproduction.taskmanager.entity.Task;
import com.frozenproduction.taskmanager.entity.Task.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByProjectId(Long projectId);
    List<Task> findByProjectIdOrderByCreatedAtDesc(Long projectId);
    List<Task> findByAssigneeId(Long assigneeId);
    List<Task> findByStatus(Status status);

    // Counts all tasks in projects owned by the given user, grouped by status.
    // One DB round-trip; returned as Object[] rows of [status, count].
    @Query("SELECT t.status, COUNT(t) FROM Task t " +
           "WHERE t.project.owner.id = :userId GROUP BY t.status")
    List<Object[]> countByStatusForOwner(@Param("userId") Long userId);
}
