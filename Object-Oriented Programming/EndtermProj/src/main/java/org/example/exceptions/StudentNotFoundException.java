package org.example.exceptions;

public class StudentNotFoundException extends RuntimeException {
    public StudentNotFoundException(String email) {
        super("Student with email: " + email + " doesn't exist");
    }
}
