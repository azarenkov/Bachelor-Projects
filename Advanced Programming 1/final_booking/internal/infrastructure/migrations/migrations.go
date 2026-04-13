package migrations

import (
	"Booking/internal/infrastructure/repository/postgres"
	"fmt"
	"io/ioutil"
	"log"
)

func applyMigration(migrationFile string) {
	sql, err := ioutil.ReadFile(migrationFile)
	if err != nil {
		log.Fatalf("Error reading migration file %s: %v", migrationFile, err)
	}

	err = postgres.DB.Exec(string(sql)).Error
	if err != nil {
		log.Fatalf("Error applying migration %s: %v", migrationFile, err)
	}

	fmt.Printf("Successfully applied migration %s\n", migrationFile)
}

func RunMigrations() {
	migrations := []string{
		"internal/infrastructure/migrations/001_create_users_table.sql",
		"internal/infrastructure/migrations/002_create_hotels_table.sql",
		"internal/infrastructure/migrations/003_create_rooms_table.sql",
		"internal/infrastructure/migrations/004_create_reservations_table.sql",
	}

	for _, migration := range migrations {
		applyMigration(migration)
	}

	fmt.Println("All migrations applied successfully!")
}
