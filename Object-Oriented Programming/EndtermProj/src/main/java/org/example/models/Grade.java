package org.example.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "grades")
public class Grade {

    @Id
    @Column(nullable = false)
    private String name;

    @OneToOne
    private Teacher teacher;

    @OneToOne
    private Student student;

    @Column(nullable = false)
    private String percentage;
}
