package org.example.services;

import org.example.models.GroupTeacher;
import org.example.repositories.GroupTeacherRepoInterface;
import org.example.services.interfaces.GroupTeacherServiceInterface;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class GroupTeacherService implements GroupTeacherServiceInterface {

    @Autowired
    private GroupTeacherRepoInterface groupTeacherRepo;

    @Override
    public List<GroupTeacher> findAll() {
        return groupTeacherRepo.findAll();
    }

    @Override
    public Optional<GroupTeacher> findById(Long id) {
        return groupTeacherRepo.findById(id);
    }

    @Override
    public GroupTeacher save(GroupTeacher groupTeacher) {
        return groupTeacherRepo.save(groupTeacher);
    }

    @Override
    public void deleteById(Long id) {
        groupTeacherRepo.deleteById(id);
    }
}