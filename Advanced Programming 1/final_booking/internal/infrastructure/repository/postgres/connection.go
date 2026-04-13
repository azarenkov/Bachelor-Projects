package postgres

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() {
	_ = godotenv.Load()

	dbHost := os.Getenv("POSTGRES_HOST")
	dbPort := os.Getenv("POSTGRES_PORT")
	dbUser := os.Getenv("POSTGRES_USER")
	dbPassword := os.Getenv("POSTGRES_PASSWORD")
	dbName := os.Getenv("POSTGRES_DB")

	if dbHost == "" || dbPort == "" || dbUser == "" || dbPassword == "" || dbName == "" {
		log.Println("Missing database configuration:")
		log.Printf("POSTGRES_HOST: %q\n", dbHost)
		log.Printf("POSTGRES_PORT: %q\n", dbPort)
		log.Printf("POSTGRES_USER: %q\n", dbUser)
		log.Printf("POSTGRES_PASSWORD: %q\n", dbPassword)
		log.Printf("POSTGRES_DB: %q\n", dbName)
		log.Fatal("Please set all required environment variables")
	}

	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		dbHost, dbPort, dbUser, dbPassword, dbName)

	log.Printf("Connecting to database: host=%s port=%s dbname=%s user=%s", dbHost, dbPort, dbName, dbUser)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Error connecting to the database: %v", err)
	}

	log.Println("Database connection successfully established!")

	if err := runMigrations(dsn); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}
}

func runMigrations(dsn string) error {
	log.Println("Running migrations...")

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		log.Printf("ERROR: Failed to open database for migrations: %v", err)
		return fmt.Errorf("failed to open database: %w", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Printf("ERROR: Failed to ping database: %v", err)
		return fmt.Errorf("failed to ping database: %w", err)
	}
	log.Println("Database connection for migrations verified")

	migrationFiles := []string{
		"001_create_users_table.sql",
		"002_create_hotels_table.sql",
		"003_create_rooms_table.sql",
		"004_create_reservations_table.sql",
	}

	for i, fileName := range migrationFiles {
		migrationPath := filepath.Join("internal", "infrastructure", "migrations", fileName)

		log.Printf("Reading migration file %d/%d: %s", i+1, len(migrationFiles), fileName)

		sqlBytes, err := os.ReadFile(migrationPath)
		if err != nil {
			log.Printf("WARNING: Could not read migration file %s: %v", fileName, err)
			continue
		}

		commands := extractUpCommands(string(sqlBytes))

		if len(commands) == 0 {
			log.Printf("WARNING: No commands found in migration file %s", fileName)
			continue
		}

		log.Printf("Found %d commands in migration %s", len(commands), fileName)

		for cmdIdx, cmd := range commands {
			cmd = strings.TrimSpace(cmd)
			if cmd == "" {
				continue
			}

			log.Printf("Executing command %d/%d from %s", cmdIdx+1, len(commands), fileName)
			log.Printf("SQL: %s", cmd)

			if _, err := db.Exec(cmd); err != nil {
				log.Printf("ERROR: Command %d from %s failed: %v", cmdIdx+1, fileName, err)
				return fmt.Errorf("failed to execute command %d from %s: %w", cmdIdx+1, fileName, err)
			}
			log.Printf("Command %d completed successfully", cmdIdx+1)
		}

		log.Printf("Migration %s completed successfully", fileName)
	}

	log.Println("All migrations completed successfully!")
	return nil
}

func extractUpCommands(sql string) []string {
	lines := strings.Split(sql, "\n")
	var sqlLines []string
	inUpSection := false

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)

		if strings.Contains(trimmed, "+goose Up") {
			inUpSection = true
			continue
		}

		if strings.Contains(trimmed, "+goose Down") {
			break
		}

		if !inUpSection {
			continue
		}

		if trimmed == "" || strings.HasPrefix(trimmed, "--") {
			continue
		}

		sqlLines = append(sqlLines, line)
	}

	fullSQL := strings.Join(sqlLines, "\n")
	commands := strings.Split(fullSQL, ";")

	var result []string
	for _, cmd := range commands {
		cmd = strings.TrimSpace(cmd)
		if cmd != "" {
			result = append(result, cmd)
		}
	}

	return result
}

func CloseDB() {
	if DB != nil {
		sqlDB, err := DB.DB()
		if err != nil {
			log.Printf("Error getting database instance: %v", err)
			return
		}

		if err := sqlDB.Close(); err != nil {
			log.Printf("Error closing database connection: %v", err)
		} else {
			log.Println("Database connection closed successfully")
		}
	}
}
