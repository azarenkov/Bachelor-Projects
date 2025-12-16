package org.example.repositories;

import org.example.models.GroupTeacher;
import org.example.models.Student;
import org.springframework.data.jpa.repository.JpaRepository;


public interface StudentRepositoryInterface extends JpaRepository<Student, String>  {
    Student findByEmail(String email);

    interface GroupTeacherRepositoryInterface extends JpaRepository<GroupTeacher, Long> {
    }
}
