#!/bin/bash
set -e

# Create additional databases for testing if needed
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create test database
    CREATE DATABASE fin_smart_test;
    
    -- Create additional extensions if needed
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    
    -- Grant permissions
    GRANT ALL PRIVILEGES ON DATABASE fin_smart_dev TO postgres;
    GRANT ALL PRIVILEGES ON DATABASE fin_smart_test TO postgres;
    
    -- Log successful initialization
    SELECT 'FinSmart database initialization completed' as status;
EOSQL

echo "FinSmart PostgreSQL initialization completed successfully!"
