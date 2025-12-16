package org.example.services;

import org.example.models.Grade;
import org.example.repositories.GradeRepositoryInterface;
import org.example.services.interfaces.GradeServiceInterface;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GradeService implements GradeServiceInterface {
    private final GradeRepositoryInterface repo;

    public GradeService(GradeRepositoryInterface repo) {
        this.repo = repo;
    }

    @Override
    public List<Grade> getAll(String student_email) {
        return repo.findByStudentEmail(student_email);
    }

    @Override
    public Grade create(Grade grade) {
        return repo.save(grade);
    }

    @Override
    public void deleteById(String name) {
        repo.deleteById(name);
    }
}
