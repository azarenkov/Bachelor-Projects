package worker

import (
	"assignment-2/internal/store"
	"fmt"
	"time"
)

type StatsWorker struct {
	store    *store.DataStore
	stopChan chan struct{}
	doneChan chan struct{}
}

func NewStatsWorker(store *store.DataStore) *StatsWorker {
	return &StatsWorker{
		store:    store,
		stopChan: make(chan struct{}),
		doneChan: make(chan struct{}),
	}
}

func (w *StatsWorker) Start() {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()
	defer close(w.doneChan)

	for {
		select {
		case <-ticker.C:
			requests, keys, _ := w.store.GetStats()
			fmt.Printf("[STATS] Requests: %d, Keys: %d\n", requests, keys)
		case <-w.stopChan:
			fmt.Println("[WORKER] Stopping background worker...")
			return
		}
	}
}

func (w *StatsWorker) Stop() {
	close(w.stopChan)
	<-w.doneChan
	fmt.Println("[WORKER] Background worker stopped")
}
