package com.frozenproduction.taskmanager.service;

import com.frozenproduction.taskmanager.dto.LinkLoggerLinkDto;
import com.frozenproduction.taskmanager.exception.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

/**
 * Backend-to-backend client for the Link Logger service.
 *
 * Why this exists:
 *   Task Manager has a feature where a user can create a task from a link
 *   they previously shortened in Link Logger. To avoid requiring the user
 *   to paste the long URL again, the backend fetches the link from Link
 *   Logger's public API and snapshots the relevant fields onto the new
 *   Task row.
 *
 * Design notes:
 *   - Link Logger is unauthenticated (public). No token, no header.
 *   - CORS on Link Logger is browser-only; server-to-server HTTP is not
 *     subject to CORS, so we can call it directly from this Spring Boot
 *     service without proxying through the browser.
 *   - We snapshot the link at import time (see Task.sourceLink*) rather
 *     than holding a live foreign key. This avoids fanning out to Link
 *     Logger on every page render and lets the task survive even if the
 *     source link is deleted.
 *   - Timeouts are tight (3s connect, 5s read). Render free-tier cold
 *     starts can take 30–50s; if the call hits cold start the user gets
 *     an ApiException(503) and can retry. We accept this latency cost in
 *     exchange for not having to manage a circuit breaker for a portfolio
 *     demo.
 *   - 4xx → ApiException(400), 5xx and timeouts → ApiException(503) so
 *     the frontend can show a useful message instead of a generic 500.
 */
@Service
public class LinkLoggerClient {

    private static final Logger log = LoggerFactory.getLogger(LinkLoggerClient.class);

    private final RestClient restClient;
    private final String publicBaseUrl;

    public LinkLoggerClient(
            // Default values here are belt-and-braces: even if application.properties
            // isn't loaded for some reason, the bean still constructs. The defaults
            // point at localhost (for local FastAPI dev). Production overrides via
            // the env vars LINK_LOGGER_API_URL and LINK_LOGGER_PUBLIC_BASE_URL.
            @Value("${link-logger.api-url:http://localhost:8000}") String apiUrl,
            @Value("${link-logger.public-base-url:http://localhost:5173}") String publicBaseUrl) {
        this.restClient = RestClient.builder()
                .baseUrl(apiUrl)
                .build();
        this.publicBaseUrl = stripTrailingSlash(publicBaseUrl);
    }

    /**
     * Fetch a link by its Link Logger ID.
     *
     * @throws ApiException(400) if Link Logger says the link doesn't exist
     * @throws ApiException(503) if Link Logger is unreachable, returns 5xx,
     *                           or times out (cold start, network down)
     */
    public LinkLoggerLinkDto fetchLink(long linkId) {
        try {
            return restClient.get()
                    .uri("/api/links/{id}", linkId)
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, (req, res) -> {
                        // 404 most commonly — the user typed a wrong ID or
                        // the link was deleted on the Link Logger side.
                        log.warn("Link Logger returned {} for link id={}",
                                res.getStatusCode(), linkId);
                        throw new ApiException(
                                "Link not found in Link Logger (id=" + linkId + ")");
                    })
                    .onStatus(HttpStatusCode::is5xxServerError, (req, res) -> {
                        log.warn("Link Logger returned {} for link id={}",
                                res.getStatusCode(), linkId);
                        throw new ApiException(
                                "Link Logger is currently unavailable. Please try again.");
                    })
                    .body(LinkLoggerLinkDto.class);
        } catch (ApiException e) {
            // Already shaped correctly — re-throw as-is.
            throw e;
        } catch (Exception e) {
            // Connection refused, read timeout, DNS failure, malformed JSON.
            // Render free-tier cold starts can hit any of these on first call.
            log.warn("Link Logger call failed for link id={}: {}",
                    linkId, e.getClass().getSimpleName() + ": " + e.getMessage());
            throw new ApiException(
                    "Link Logger is currently unavailable. Please try again.");
        }
    }

    /**
     * Reconstruct the publicly reachable short URL for a link. Useful when
     * the snapshot in Task.sourceLinkShortCode is shown in the UI and we
     * want the clickable full URL.
     */
    public String publicShortUrl(String shortCode) {
        return publicBaseUrl + "/" + shortCode;
    }

    private static String stripTrailingSlash(String s) {
        if (s == null) return "";
        return s.endsWith("/") ? s.substring(0, s.length() - 1) : s;
    }
}
