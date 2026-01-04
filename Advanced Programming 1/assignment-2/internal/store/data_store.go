package store

import (
	"assignment-2/internal/model"
	"sync/atomic"
	"time"
)

type DataStore struct {
	store     *model.Store[string, string]
	requests  atomic.Int64
	startTime time.Time
}

func NewDataStore() *DataStore {
	return &DataStore{
		store:     model.NewStore[string, string](),
		startTime: time.Now(),
	}
}

func (ds *DataStore) Set(key, value string) {
	ds.store.Set(key, value)
}

func (ds *DataStore) Get(key string) (string, bool) {
	return ds.store.Get(key)
}

func (ds *DataStore) Delete(key string) bool {
	return ds.store.Delete(key)
}

func (ds *DataStore) GetAll() map[string]string {
	return ds.store.Snapshot()
}

func (ds *DataStore) GetStats() (requests int64, keys int, uptime int64) {
	return ds.requests.Load(), ds.store.Count(), int64(time.Since(ds.startTime).Seconds())
}

func (ds *DataStore) IncrementRequests() {
	ds.requests.Add(1)
}
