package com.frozenproduction.taskmanager.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "tasks")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Task {

    public enum Status {
        TODO, IN_PROGRESS, DONE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.TODO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    private User assignee;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    // --- Link-Logger integration (snapshot at task-creation time) ---
    // We deliberately snapshot the link's data into the Task at import time
    // rather than holding a live foreign key. Trade-off: the click count
    // becomes a snapshot, but renders don't fan out to Link Logger on every
    // page load, and the task survives even if the source link is deleted.
    // All three are nullable — tasks created without an imported link leave
    // them null and the UI hides the badge.

    @Column(name = "source_link_short_code", length = 20)
    private String sourceLinkShortCode;

    @Column(name = "source_link_url", length = 2000)
    private String sourceLinkUrl;

    @Column(name = "source_link_clicks_at_import")
    private Integer sourceLinkClicksAtImport;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
