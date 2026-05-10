package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	_ "modernc.org/sqlite"

	"github.com/ajaxl/finance-tracker/internal/handler"
	"github.com/ajaxl/finance-tracker/internal/repository"
	"github.com/ajaxl/finance-tracker/internal/service"
)

func main() {
	// Database path
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "./data/finance.db"
	}

	// Ensure data directory exists
	dbDir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dbDir, 0755); err != nil {
		log.Fatalf("Error creating data directory: %v", err)
	}

	// Open SQLite database
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		log.Fatalf("Error opening database: %v", err)
	}
	defer db.Close()

	// Enable WAL mode for better concurrency
	if _, err := db.Exec("PRAGMA journal_mode=WAL"); err != nil {
		log.Printf("Warning: could not enable WAL mode: %v", err)
	}
	if _, err := db.Exec("PRAGMA foreign_keys=ON"); err != nil {
		log.Printf("Warning: could not enable foreign keys: %v", err)
	}

	// Run migrations
	if err := runMigrations(db); err != nil {
		log.Fatalf("Error running migrations: %v", err)
	}
	log.Println("Migrations executed successfully")

	// Load seeds if needed
	if err := loadSeeds(db); err != nil {
		log.Fatalf("Error loading seeds: %v", err)
	}
	log.Println("Seeds loaded successfully")

	// Initialize repositories
	periodRepo := repository.NewPeriodRepo(db)
	categoryRepo := repository.NewCategoryRepo(db)
	transactionRepo := repository.NewTransactionRepo(db)
	summaryRepo := repository.NewSummaryRepo(db)

	// Initialize services
	transactionService := service.NewTransactionService(db, transactionRepo, categoryRepo, periodRepo, summaryRepo)
	categoryService := service.NewCategoryService(categoryRepo)
	periodService := service.NewPeriodService(periodRepo, summaryRepo)
	summaryService := service.NewSummaryService(summaryRepo, periodRepo)

	// Initialize handlers
	transactionHandler := handler.NewTransactionHandler(transactionService)
	categoryHandler := handler.NewCategoryHandler(categoryService)
	periodHandler := handler.NewPeriodHandler(periodService)
	summaryHandler := handler.NewSummaryHandler(summaryService)

	// Setup router
	mux := http.NewServeMux()

	// Register routes (Go 1.22+ pattern matching)
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

	// Health check
	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})

	// Apply CORS middleware
	corsHandler := corsMiddleware(mux)

	// Get port
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
	log.Printf("API available at http://localhost:%s/api", port)

	if err := server.ListenAndServe(); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}

// corsMiddleware adds CORS headers to all responses.
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

// runMigrations executes the SQL migration file.
func runMigrations(db *sql.DB) error {
	migrationPath := filepath.Join("migrations", "001_initial.sql")
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

// loadSeeds loads seed data if the categories table is empty.
func loadSeeds(db *sql.DB) error {
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM category_groups").Scan(&count)
	if err != nil {
		return fmt.Errorf("check category_groups count: %w", err)
	}

	if count > 0 {
		log.Printf("Seeds already loaded (%d category groups found), skipping", count)
		return nil
	}

	seedPath := filepath.Join("seeds", "categories.sql")
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
