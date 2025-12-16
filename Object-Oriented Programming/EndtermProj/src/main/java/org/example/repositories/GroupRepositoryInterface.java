package org.example.repositories;

import org.example.models.Group;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GroupRepositoryInterface extends JpaRepository<Group, Long> {
}