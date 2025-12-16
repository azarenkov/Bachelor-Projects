package org.example.services.interfaces;

import org.example.models.GroupTeacher;

import java.util.List;
import java.util.Optional;

public interface GroupTeacherServiceInterface {
    List<GroupTeacher> findAll();
    Optional<GroupTeacher> findById(Long id);
    GroupTeacher save(GroupTeacher groupTeacher);
    void deleteById(Long id);
}