package com.frozenproduction.taskmanager.dto;

/**
 * Internal DTO for parsing Link Logger's GET /api/links/{id} response.
 *
 * Link Logger is a Python/FastAPI service that returns snake_case fields.
 * We only deserialize the fields we actually use to keep the surface tight;
 * unknown fields are ignored by Jackson's default settings.
 *
 * NOTE: kept as a Java record rather than a Lombok @Data class because we
 * only deserialize it (never serialize, never validate). If we ever expose
 * link data on a public endpoint, add Bean Validation annotations.
 */
public record LinkLoggerLinkDto(
        long id,
        String original_url,
        String short_code,
        String short_url,
        String created_at,
        int clicks
) {}
