package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	_ "github.com/lib/pq"
	_ "modernc.org/sqlite"

	"github.com/chamoouske/finance-tracker/internal/handler"
	"github.com/chamoouske/finance-tracker/internal/repository"
	"github.com/chamoouske/finance-tracker/internal/service"
)

func main() {
	db := initDB()
	defer db.Close()

	periodRepo := repository.NewPeriodRepository(db)
	categoryRepo := repository.NewCategoryRepository(db)
	transactionRepo := repository.NewTransactionRepository(db)
	summaryRepo := repository.NewSummaryRepository(db)

	transactionService := service.NewTransactionService(transactionRepo, categoryRepo, periodRepo, summaryRepo)
	categoryService := service.NewCategoryService(categoryRepo)
	periodService := service.NewPeriodService(periodRepo, summaryRepo)
	summaryService := service.NewSummaryService(summaryRepo, periodRepo)

	transactionHandler := handler.NewTransactionHandler(transactionService)
	categoryHandler := handler.NewCategoryHandler(categoryService)
	periodHandler := handler.NewPeriodHandler(periodService)
	summaryHandler := handler.NewSummaryHandler(summaryService)

	mux := http.NewServeMux()

	mux.HandleFunc("POST /api/transactions", transactionHandler.Create)
	mux.HandleFunc("GET /api/transactions", transactionHandler.List)
	mux.HandleFunc("PATCH /api/transactions/{id}", transactionHandler.Update)
	mux.HandleFunc("DELETE /api/transactions/{id}", transactionHandler.Delete)

	mux.HandleFunc("GET /api/categories", categoryHandler.List)
	mux.HandleFunc("POST /api/categories", categoryHandler.Create)
	mux.HandleFunc("PATCH /api/categories/{id}", categoryHandler.Update)
	mux.HandleFunc("DELETE /api/categories/{id}", categoryHandler.Delete)

	mux.HandleFunc("GET /api/periods", periodHandler.List)
	mux.HandleFunc("POST /api/periods/close", periodHandler.Close)

	mux.HandleFunc("GET /api/summary", summaryHandler.Get)

	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})

	corsHandler := corsMiddleware(mux)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      corsHandler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	log.Printf("Server starting on port %s", port)

	if err := server.ListenAndServe(); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}

func initDB() *sql.DB {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL != "" {
		return initPostgres(databaseURL)
	}
	return initSQLite()
}

func initPostgres(databaseURL string) *sql.DB {
	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		log.Fatalf("Error opening PostgreSQL database: %v", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	if err := db.Ping(); err != nil {
		log.Fatalf("Error connecting to PostgreSQL: %v", err)
	}
	log.Println("Connected to PostgreSQL")

	if err := runMigrations(db, "postgres"); err != nil {
		log.Fatalf("Error running migrations: %v", err)
	}
	log.Println("Migrations executed successfully")

	if err := loadSeeds(db, "postgres"); err != nil {
		log.Fatalf("Error loading seeds: %v", err)
	}
	log.Println("Seeds loaded successfully")

	return db
}

func initSQLite() *sql.DB {
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "./data/finance.db"
	}

	dbDir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dbDir, 0755); err != nil {
		log.Fatalf("Error creating data directory: %v", err)
	}

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		log.Fatalf("Error opening database: %v", err)
	}

	if _, err := db.Exec("PRAGMA journal_mode=WAL"); err != nil {
		log.Printf("Warning: could not enable WAL mode: %v", err)
	}
	if _, err := db.Exec("PRAGMA foreign_keys=ON"); err != nil {
		log.Printf("Warning: could not enable foreign keys: %v", err)
	}

	if err := runMigrations(db, "sqlite"); err != nil {
		log.Fatalf("Error running migrations: %v", err)
	}
	log.Println("Migrations executed successfully")

	if err := loadSeeds(db, "sqlite"); err != nil {
		log.Fatalf("Error loading seeds: %v", err)
	}
	log.Println("Seeds loaded successfully")

	return db
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func migrationFile(driver string) string {
	if driver == "postgres" {
		return filepath.Join("migrations", "001_initial.postgres.sql")
	}
	return filepath.Join("migrations", "001_initial.sql")
}

func seedFile(driver string) string {
	if driver == "postgres" {
		return filepath.Join("seeds", "categories.postgres.sql")
	}
	return filepath.Join("seeds", "categories.sql")
}

func runMigrations(db *sql.DB, driver string) error {
	migrationPath := migrationFile(driver)
	data, err := os.ReadFile(migrationPath)
	if err != nil {
		return fmt.Errorf("read migration file: %w", err)
	}

	_, err = db.Exec(string(data))
	if err != nil {
		return fmt.Errorf("execute migration: %w", err)
	}

	return nil
}

func loadSeeds(db *sql.DB, driver string) error {
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM category_groups").Scan(&count)
	if err != nil {
		return fmt.Errorf("check category_groups count: %w", err)
	}

	if count > 0 {
		log.Printf("Seeds already loaded (%d category groups found), skipping", count)
		return nil
	}

	seedPath := seedFile(driver)
	data, err := os.ReadFile(seedPath)
	if err != nil {
		return fmt.Errorf("read seed file: %w", err)
	}

	_, err = db.Exec(string(data))
	if err != nil {
		return fmt.Errorf("execute seeds: %w", err)
	}

	return nil
}
