package org.example.services;

import org.example.models.Student;
import org.example.models.Teacher;
import org.example.repositories.TeacherRepositoryInterface;
import org.example.services.interfaces.TeacherServiceInterface;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TeacherService implements TeacherServiceInterface {
    private final TeacherRepositoryInterface repo;

    public TeacherService(TeacherRepositoryInterface repo) {
        this.repo = repo;
    }

    @Override
    public List<Teacher> getAll() {
        return repo.findAll(Sort.by("name"));
    }

    @Override
    public Teacher getByEmail(String email) {
        return repo.findByEmail(email);
    }

    @Override
    public Teacher create(Teacher teacher) {
        return repo.save(teacher);
    }

    @Override
    public boolean loginInAccount(String login, String password) {
        Teacher teacher = repo.findByEmail(login);
        return teacher != null && teacher.getPassword().equals(password);
    }
}
