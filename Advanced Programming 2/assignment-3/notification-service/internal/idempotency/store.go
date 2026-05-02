package idempotency

import "sync"

type Store struct {
	mu   sync.Mutex
	seen map[string]struct{}
}

func NewStore() *Store {
	return &Store{seen: make(map[string]struct{})}
}

func (s *Store) MarkProcessed(messageID string) (newlyProcessed bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.seen[messageID]; ok {
		return false
	}
	s.seen[messageID] = struct{}{}
	return true
}

func (s *Store) Has(messageID string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	_, ok := s.seen[messageID]
	return ok
}
