package org.example.controllers;
import org.example.exceptions.StudentNotFoundException;
import org.example.models.Student;
import org.example.services.interfaces.StudentServiceInterface;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("api/v1/students")
public class StudentController {
    private static final Logger logger = LoggerFactory.getLogger(StudentController.class);

    private final StudentServiceInterface service;

    public StudentController(StudentServiceInterface service) {
        this.service = service;
    }

    @GetMapping("/get_all_students")
    public ResponseEntity<List<Student>> getAll() {
        try {
            List<Student> students = service.getAll();
            return new ResponseEntity<>(students, HttpStatus.OK);
        } catch (Exception e) {
            logger.error("Error fetching all students", e);
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/get_student_by_email/{email}")
    public ResponseEntity<Student> getByEmail(@PathVariable("email") String email) {
        try {
            Student student = service.getByEmail(email);
            return new ResponseEntity<>(student, HttpStatus.OK);
        } catch (StudentNotFoundException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/create_student")
    public ResponseEntity<String> create(@RequestBody Student student) {
        try {
            logger.info("Creating student: {}", student);
            service.create(student);
            return new ResponseEntity<>("User was created", HttpStatus.CREATED);
        } catch (Exception e) {
            logger.error("Internal server error while creating student: {}", student, e);
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
            logger.error("Internal server error while logging in student", e);
            return new ResponseEntity<>(false, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping("/delete_student_by_id/{email}")
    public ResponseEntity<String> deleteByEmail(@PathVariable("email") String email) {
        try {
            service.delete(email);
            return new ResponseEntity<>("User was deleted", HttpStatus.OK);
        } catch (StudentNotFoundException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
