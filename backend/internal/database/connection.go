package database

import (
	"database/sql"
	"fmt"
	"os"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

var DB *sql.DB

func Connect() error {
	// Cargar variables de entorno
	err := godotenv.Load()
	if err != nil {
		fmt.Println("Warning: .env file not found, using environment variables")
	}

	// Obtener URL de la base de datos desde variables de entorno
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		return fmt.Errorf("DATABASE_URL environment variable is not set")
	}

	// Conectar a la base de datos
	DB, err = sql.Open("postgres", databaseURL)
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}

	// Verificar conexión
	if err = DB.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}

	fmt.Println("Database connected successfully")
	return createTables()
}

func createTables() error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            elo INTEGER DEFAULT 1000,
            wins INTEGER DEFAULT 0,
            losses INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )`,

		`CREATE TABLE IF NOT EXISTS queue (
            user_id UUID PRIMARY KEY REFERENCES users(id),
            joined_at TIMESTAMP DEFAULT NOW()
        )`,

		`CREATE TABLE IF NOT EXISTS matches (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            status VARCHAR(20) DEFAULT 'draft',
            team1 UUID[] NOT NULL,
            team2 UUID[] NOT NULL,
            captain1 UUID REFERENCES users(id),
            captain2 UUID REFERENCES users(id),
            selected_map VARCHAR(50),
            banned_maps VARCHAR(50)[],
            winner VARCHAR(10),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )`,

		`CREATE TABLE IF NOT EXISTS votes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            match_id UUID REFERENCES matches(id),
            user_id UUID REFERENCES users(id),
            winner VARCHAR(10) NOT NULL,
            voted_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(match_id, user_id)
        )`,
	}

	for _, query := range queries {
		if _, err := DB.Exec(query); err != nil {
			return fmt.Errorf("failed to create table: %w", err)
		}
	}

	fmt.Println("Database tables created successfully")
	return nil
}

func GetDB() *sql.DB {
	return DB
}
