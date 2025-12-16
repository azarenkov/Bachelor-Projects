package org.example.controllers;

import org.example.exceptions.StudentNotFoundException;
import org.example.models.Student;
import org.example.models.Teacher;
import org.example.services.interfaces.StudentServiceInterface;
import org.example.services.interfaces.TeacherServiceInterface;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("api/v1/teachers")
public class TeacherController {
    private static final Logger logger = LoggerFactory.getLogger(TeacherController.class);

    private final TeacherServiceInterface service;

    public TeacherController(TeacherServiceInterface service) {
        this.service = service;
    }

    @GetMapping("/get_all_teachers")
    public ResponseEntity<List<Teacher>> getAll() {
        try {
            List<Teacher> teachers = service.getAll();
            return new ResponseEntity<>(teachers, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/get_teacher_by_email/{email}")
    public ResponseEntity<Teacher> getByEmail(@PathVariable("email") String email) {
        try {
            Teacher teacher = service.getByEmail(email);
            return new ResponseEntity<>(teacher, HttpStatus.OK);
        } catch (StudentNotFoundException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/create_teacher")
    public ResponseEntity<String> create(@RequestBody Teacher teacher) {
        try {
            service.create(teacher);
            return new ResponseEntity<>("Teacher was created", HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>("Internal server error", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<Boolean> login(@RequestBody Map<String, String> credentials) {
        try {
            String login = credentials.get("login");
            String password = credentials.get("password");
            boolean isAuthenticated = service.loginInAccount(login, password);
            return new ResponseEntity<>(isAuthenticated, HttpStatus.OK);
        } catch (Exception e) {
            logger.error("Internal server error while logging in teacher", e);

            return new ResponseEntity<>(false, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
