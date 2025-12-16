package org.example.exceptions;

public class TeacherNotFoundException extends RuntimeException {
    public TeacherNotFoundException(String email) {
        super("Student with email: " + email + " doesn't exist");
    }
}
