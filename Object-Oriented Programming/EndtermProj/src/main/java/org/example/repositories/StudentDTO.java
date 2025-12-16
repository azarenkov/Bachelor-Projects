package org.example.repositories;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.example.models.Grade;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Getter @Setter
public class StudentDTO {
    private String email;
    private String name;
    private String surname;
    private String password;
    private Long groupId;

}