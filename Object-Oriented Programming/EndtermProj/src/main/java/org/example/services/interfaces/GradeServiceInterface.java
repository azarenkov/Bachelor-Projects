package org.example.services.interfaces;

import org.example.models.Grade;

import java.util.List;

public interface GradeServiceInterface {
    List<Grade> getAll(String student_email);
    Grade create(Grade grade);
    void deleteById(String name);
}
