package org.example.services.interfaces;

import org.example.models.Student;

import java.util.List;

public interface StudentServiceInterface extends LoginServiceInterface {
    List<Student> getAll();
    Student getByEmail(String email);
    Student create(Student student);
    void delete(String email);
}
