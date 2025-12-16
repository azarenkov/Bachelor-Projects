package org.example.services;

import org.example.models.Group;
import org.example.repositories.GroupRepositoryInterface;
import org.example.services.interfaces.GroupServiceInterface;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GroupService implements GroupServiceInterface {
    private final GroupRepositoryInterface repo;

    public GroupService(GroupRepositoryInterface repo) {
        this.repo = repo;
    }

    @Override
    public List<Group> getAll() {
        return repo.findAll(Sort.by("name"));
    }

    @Override
    public Group getById(Long id) {
        return repo.findById(id).orElse(null);
    }

    @Override
    public Group create(Group group) {
        return repo.save(group);
    }

    @Override
    public void delete(Long id) {
        repo.deleteById(id);
    }
}