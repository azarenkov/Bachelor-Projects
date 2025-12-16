package org.example.services.interfaces;

import org.example.models.Group;

import java.util.List;

public interface GroupServiceInterface {
    List<Group> getAll();
    Group getById(Long id);
    Group create(Group group);
    void delete(Long id);
}