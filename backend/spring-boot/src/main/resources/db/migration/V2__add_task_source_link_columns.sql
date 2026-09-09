-- V2: add Link Logger snapshot columns to tasks.
--
-- V1 is the implicit baseline: Flyway baselines the pre-existing schema
-- (created long ago by Hibernate) as version 1 on first run
-- (spring.flyway.baseline-on-migrate=true), then applies this migration.
-- Without baseline, first startup fails with "non-empty schema but no
-- schema history table" and the service crash-loops (seen Sept 8).
--
-- Context (Sept 8): the a05f4e5 Link Logger integration added
-- sourceLinkShortCode / sourceLinkUrl / sourceLinkClicksAtImport to the
-- Task entity, but Hibernate ddl-auto=update never added the columns to
-- the existing Render PostgreSQL table. Every full-row task query then
-- failed with "column t1_0.source_link_clicks_at_import does not exist"
-- (surfaced to users as empty 403s before the /error unmask fix).
-- Flyway applies this automatically at startup wherever it is enabled:
-- prod only (SPRING_FLYWAY_ENABLED=true on Render; off by default for
-- local/CI fresh H2, where Hibernate creates the columns itself).
--
-- IF NOT EXISTS keeps it safe on fresh databases (local H2, CI) where
-- Hibernate already creates the columns, and re-runnable anywhere.

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS source_link_short_code VARCHAR(20);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS source_link_url VARCHAR(2000);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS source_link_clicks_at_import INTEGER;
