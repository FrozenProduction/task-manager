package com.frozenproduction.taskmanager.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

/**
 * Builds the JDBC DataSource for the production (prod) profile from
 * individual environment variables. We do NOT use a single URL string
 * because Spring Boot's env-var-to-property relaxed binding has a history
 * of mangling connection-string URLs (truncating at colons, eating
 * characters silently).
 *
 * Required env vars on Render:
 *   DB_HOST       - e.g. dpg-dacnrj0ae00c73fv6r20-a
 *   DB_PORT       - e.g. 5432
 *   DB_NAME       - e.g. taskmanager_sqch
 *   DB_USERNAME   - e.g. taskmanager_user
 *   DB_PASSWORD   - the DB password from Render Info tab
 */
@Configuration
@Profile("prod")
public class DataSourceConfig {

    @Bean
    public DataSource dataSource() {
        String host = System.getenv("DB_HOST");
        String port = System.getenv("DB_PORT");
        String dbName = System.getenv("DB_NAME");
        String username = System.getenv("DB_USERNAME");
        String password = System.getenv("DB_PASSWORD");

        if (host == null || port == null || dbName == null || username == null || password == null) {
            throw new IllegalStateException(
                "Missing required DB env vars. Required: DB_HOST, DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD. " +
                "Got: DB_HOST=" + (host != null) + " DB_PORT=" + (port != null) +
                " DB_NAME=" + (dbName != null) + " DB_USERNAME=" + (username != null) +
                " DB_PASSWORD=" + (password != null)
            );
        }

        String url = "jdbc:postgresql://" + host + ":" + port + "/" + dbName;

        DriverManagerDataSource ds = new DriverManagerDataSource();
        ds.setDriverClassName("org.postgresql.Driver");
        ds.setUrl(url);
        ds.setUsername(username);
        ds.setPassword(password);
        return ds;
    }
}