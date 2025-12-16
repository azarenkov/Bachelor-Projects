package org.example.services;

import org.example.exceptions.StudentNotFoundException;
import org.example.models.Group;
import org.example.models.Student;
import org.example.models.Teacher;
import org.example.repositories.GroupRepositoryInterface;
import org.example.repositories.StudentRepositoryInterface;
import org.example.services.interfaces.StudentServiceInterface;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class StudentService implements StudentServiceInterface {
    private final StudentRepositoryInterface studentRepo;
    private final GroupRepositoryInterface groupRepo;

    public StudentService(StudentRepositoryInterface studentRepo, GroupRepositoryInterface groupRepo) {
        this.studentRepo = studentRepo;
        this.groupRepo = groupRepo;
    }

    @Override
    public List<Student> getAll() {
        return studentRepo.findAll(Sort.by("name"));
    }

    @Override
    public Student getByEmail(String email) {
        return studentRepo.findByEmail(email);

    }

    @Override
    @Transactional
    public Student create(Student student) {
        Group group = student.getGroup();
        if (group != null && group.getId() == null) {
            groupRepo.save(group);
        }
        return studentRepo.save(student);
    }

    @Override
    public void delete(String email) {
        studentRepo.deleteById(email);
    }

    @Override
    public boolean loginInAccount(String login, String password) {
        Student student = studentRepo.findByEmail(login);
        return student != null && student.getPassword().equals(password);
    }
}

