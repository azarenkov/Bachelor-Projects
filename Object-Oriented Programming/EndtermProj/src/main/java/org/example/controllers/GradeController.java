package org.example.controllers;

import org.example.models.Grade;
import org.example.services.interfaces.GradeServiceInterface;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/v1/grades")
public class GradeController {
    private final GradeServiceInterface service;

    public GradeController(GradeServiceInterface service) {
        this.service = service;
    }

    @GetMapping("/get_all_grades/{student_email}")
    public ResponseEntity<List<Grade>> getAll(@PathVariable("student_email") String studentEmail) {
        try {
            List<Grade> grades = service.getAll(studentEmail);
            return new ResponseEntity<>(grades, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/create_grade")
    public ResponseEntity<String> create(@RequestBody Grade grade) {
        try {
            service.create(grade);
            return new ResponseEntity<>("Grade was created", HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>("Internal server error", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping("/delete_grade/{name}")
    public ResponseEntity<String> deleteById(@PathVariable("name") String name) {
        try {
            service.deleteById(name);
            return new ResponseEntity<>("Grade was deleted", HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Internal server error", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}