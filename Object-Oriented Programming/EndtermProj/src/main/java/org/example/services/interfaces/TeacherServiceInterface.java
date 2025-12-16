package org.example.services.interfaces;


import org.example.models.Teacher;

import java.util.List;

public interface TeacherServiceInterface extends LoginServiceInterface {
    List<Teacher> getAll();
    Teacher getByEmail(String email);
    Teacher create(Teacher teacher);
}
