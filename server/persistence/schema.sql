-- ============================================================================
-- CODEFORGE REAL-TIME COLLABORATION DATABASE SCHEMA (PostgreSQL)
-- ============================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  github_id VARCHAR(64) UNIQUE,
  username VARCHAR(64) NOT NULL,
  name VARCHAR(128),
  avatar_url TEXT,
  profile_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Rooms Table (Strictly Private)
CREATE TABLE IF NOT EXISTS rooms (
  id VARCHAR(64) PRIMARY KEY,
  room_code VARCHAR(32) UNIQUE NOT NULL,
  name VARCHAR(128) NOT NULL,
  description TEXT,
  owner_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner_username VARCHAR(64) NOT NULL,
  language VARCHAR(32) NOT NULL DEFAULT 'javascript',
  is_private BOOLEAN DEFAULT TRUE,
  active_file_id VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Room Members Table
CREATE TABLE IF NOT EXISTS room_members (
  id VARCHAR(64) PRIMARY KEY,
  room_id VARCHAR(64) NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  github_username VARCHAR(64) NOT NULL,
  avatar_url TEXT,
  role VARCHAR(16) NOT NULL DEFAULT 'editor', -- 'owner', 'editor', 'viewer'
  color VARCHAR(16) NOT NULL,
  is_online BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(room_id, user_id)
);

-- 4. Invitations Table (Expiring, Single-Use, Revocable)
CREATE TABLE IF NOT EXISTS invitations (
  id VARCHAR(64) PRIMARY KEY,
  room_id VARCHAR(64) NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  token VARCHAR(128) UNIQUE NOT NULL,
  created_by VARCHAR(64) NOT NULL REFERENCES users(id),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_single_use BOOLEAN DEFAULT FALSE,
  used_count INTEGER DEFAULT 0,
  is_revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Chat Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(64) PRIMARY KEY,
  room_id VARCHAR(64) NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  username VARCHAR(64) NOT NULL,
  avatar_url TEXT,
  role VARCHAR(16) NOT NULL,
  text TEXT NOT NULL,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Project Files Table
CREATE TABLE IF NOT EXISTS project_files (
  id VARCHAR(64) PRIMARY KEY,
  room_id VARCHAR(64) NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  name VARCHAR(256) NOT NULL,
  lang VARCHAR(32) NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(room_id, name)
);

-- 7. Document Updates (Yjs CRDT Binary Updates)
CREATE TABLE IF NOT EXISTS document_updates (
  id SERIAL PRIMARY KEY,
  room_id VARCHAR(64) NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  file_id VARCHAR(64) NOT NULL,
  update_data BYTEA NOT NULL,
  sender_id VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Snapshots (Time-Travel History Checkpoints)
CREATE TABLE IF NOT EXISTS snapshots (
  id VARCHAR(64) PRIMARY KEY,
  room_id VARCHAR(64) NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  name VARCHAR(128) NOT NULL,
  created_by VARCHAR(64) NOT NULL,
  files_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Inline Code Comments Table
CREATE TABLE IF NOT EXISTS code_comments (
  id VARCHAR(64) PRIMARY KEY,
  room_id VARCHAR(64) NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  file_id VARCHAR(64) NOT NULL,
  line_number INTEGER NOT NULL,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id),
  username VARCHAR(64) NOT NULL,
  avatar_url TEXT,
  content TEXT NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  replies_json JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Room Events (Audit / Execution Log)
CREATE TABLE IF NOT EXISTS room_events (
  id SERIAL PRIMARY KEY,
  room_id VARCHAR(64) NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  event_type VARCHAR(64) NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for lightning-fast queries
CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_room_members_room ON room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_messages_room_time ON messages(room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_project_files_room ON project_files(room_id);
CREATE INDEX IF NOT EXISTS idx_doc_updates_room_file ON document_updates(room_id, file_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_room ON snapshots(room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_code_comments_file ON code_comments(room_id, file_id, line_number);

