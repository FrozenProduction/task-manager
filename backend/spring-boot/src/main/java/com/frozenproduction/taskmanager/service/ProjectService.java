package com.frozenproduction.taskmanager.service;

import com.frozenproduction.taskmanager.dto.ProjectDto;
import com.frozenproduction.taskmanager.dto.CreateProjectRequest;
import com.frozenproduction.taskmanager.entity.Project;
import com.frozenproduction.taskmanager.entity.User;
import com.frozenproduction.taskmanager.repository.ProjectRepository;
import com.frozenproduction.taskmanager.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public ProjectDto createProject(CreateProjectRequest request, Long userId) {
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Project project = Project.builder()
                .name(request.getName())
                .description(request.getDescription())
                .owner(owner)
                .build();

        project = projectRepository.save(project);
        return toDto(project);
    }

    public List<ProjectDto> getProjectsByUser(Long userId) {
        return projectRepository.findByOwnerId(userId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public ProjectDto getProjectById(Long projectId, Long userId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        if (!project.getOwner().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        return toDto(project);
    }

    public ProjectDto updateProject(Long projectId, CreateProjectRequest request, Long userId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        if (!project.getOwner().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project = projectRepository.save(project);
        return toDto(project);
    }

    @Transactional
    public void deleteProject(Long projectId, Long userId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        if (!project.getOwner().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        projectRepository.delete(project);
    }

    private ProjectDto toDto(Project project) {
        User owner = project.getOwner();
        return ProjectDto.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .ownerId(owner.getId())
                .ownerUsername(owner.getUsername())
                .createdAt(project.getCreatedAt() != null ? project.getCreatedAt().toString() : null)
                .updatedAt(project.getUpdatedAt() != null ? project.getUpdatedAt().toString() : null)
                .build();
    }
}
