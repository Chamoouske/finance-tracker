package job

import (
	"context"
	"database/sql"
	"log"
	"time"

	"github.com/chamoouske/finance-tracker/internal/repository"
)

type SyncJob struct {
	summaryRepo repository.SummaryRepository
	balanceRepo repository.BalanceSnapshotRepository
	db          *sql.DB
	interval    time.Duration
}

func NewSyncJob(
	summaryRepo repository.SummaryRepository,
	balanceRepo repository.BalanceSnapshotRepository,
	db *sql.DB,
	interval time.Duration,
) *SyncJob {
	return &SyncJob{
		summaryRepo: summaryRepo,
		balanceRepo: balanceRepo,
		db:          db,
		interval:    interval,
	}
}

func (j *SyncJob) Start(ctx context.Context) {
	ticker := time.NewTicker(j.interval)
	defer ticker.Stop()

	// Executa imediatamente ao iniciar
	j.run(ctx)

	for {
		select {
		case <-ticker.C:
			j.run(ctx)
		case <-ctx.Done():
			log.Println("[SyncJob] Stopped")
			return
		}
	}
}

func (j *SyncJob) run(ctx context.Context) {
	log.Println("[SyncJob] Starting recalculation...")

	// Executa tudo dentro de uma única transação
	tx, err := j.db.BeginTx(ctx, nil)
	if err != nil {
		log.Printf("[SyncJob] Error beginning transaction: %v", err)
		return
	}
	defer tx.Rollback()

	// 1. Recalcula todos os summaries
	if err := j.summaryRepo.RecalculateAll(ctx, tx); err != nil {
		log.Printf("[SyncJob] Error recalculating summaries: %v", err)
		return
	}

	// 2. Recalcula o balance snapshot
	if err := j.balanceRepo.Recalculate(ctx, tx); err != nil {
		log.Printf("[SyncJob] Error recalculating balance snapshot: %v", err)
		return
	}

	if err := tx.Commit(); err != nil {
		log.Printf("[SyncJob] Error committing transaction: %v", err)
		return
	}

	log.Println("[SyncJob] Recalculation completed successfully")
}
