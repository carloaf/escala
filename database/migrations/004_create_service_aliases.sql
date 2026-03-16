CREATE TABLE IF NOT EXISTS service_aliases (
    id SERIAL PRIMARY KEY,
    alias_name VARCHAR(255) NOT NULL UNIQUE,
    canonical_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_service_aliases_canonical_name ON service_aliases(canonical_name);