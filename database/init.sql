-- Initialize database schema

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    military_id VARCHAR(50),
    rank VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS schedules (
    id SERIAL PRIMARY KEY,
    service VARCHAR(255),
    date VARCHAR(50),
    time VARCHAR(50),
    name VARCHAR(255),
    military_id VARCHAR(50),
    rank VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS schedule_changes (
    id SERIAL PRIMARY KEY,
    schedule_id INTEGER REFERENCES schedules(id),
    old_service VARCHAR(255),
    new_service VARCHAR(255),
    old_date VARCHAR(50),
    new_date VARCHAR(50),
    old_time VARCHAR(50),
    new_time VARCHAR(50),
    old_name VARCHAR(255),
    new_name VARCHAR(255),
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notified BOOLEAN DEFAULT FALSE
);

-- Create index for faster lookups
CREATE INDEX idx_schedules_name ON schedules(name);
CREATE INDEX idx_schedules_date ON schedules(date);
CREATE INDEX idx_schedules_military_id ON schedules(military_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_schedule_changes_schedule_id ON schedule_changes(schedule_id);
CREATE INDEX idx_schedule_changes_notified ON schedule_changes(notified);
