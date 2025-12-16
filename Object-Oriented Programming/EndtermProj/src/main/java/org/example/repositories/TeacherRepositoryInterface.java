package org.example.repositories;


import org.example.models.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeacherRepositoryInterface extends JpaRepository<Teacher, String> {
    Teacher findByEmail(String email);
}
