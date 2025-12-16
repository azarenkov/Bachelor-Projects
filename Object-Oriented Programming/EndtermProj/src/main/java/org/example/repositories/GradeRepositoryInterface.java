package org.example.repositories;

import org.example.models.Grade;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GradeRepositoryInterface extends JpaRepository<Grade, String> {
    List<Grade> findByStudentEmail(String student_email);
}