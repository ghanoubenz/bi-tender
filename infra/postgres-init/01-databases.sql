-- One server, two databases: platform and ai_engine (ADR-005).
CREATE DATABASE ai_engine OWNER tender;
\connect ai_engine
CREATE EXTENSION IF NOT EXISTS vector;
