package org.example.controllers;

import org.example.models.GroupTeacher;
import org.example.services.interfaces.GroupTeacherServiceInterface;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("api/v1/group-teachers")
public class GroupTeacherController {
    private static final Logger logger = LoggerFactory.getLogger(GroupTeacherController.class);

    private final GroupTeacherServiceInterface service;

    public GroupTeacherController(GroupTeacherServiceInterface service) {
        this.service = service;
    }

    @GetMapping("/get_all_group_teachers")
    public ResponseEntity<List<GroupTeacher>> getAll() {
        try {
            List<GroupTeacher> groupTeachers = service.findAll();
            return new ResponseEntity<>(groupTeachers, HttpStatus.OK);
        } catch (Exception e) {
            logger.error("Error fetching all group teachers", e);
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/get_group_teacher_by_id/{id}")
    public ResponseEntity<GroupTeacher> getById(@PathVariable("id") Long id) {
        try {
            Optional<GroupTeacher> groupTeacher = service.findById(id);
            return groupTeacher.map(ResponseEntity::ok).orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
        } catch (Exception e) {
            logger.error("Error fetching group teacher by id", e);
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/create_group_teacher")
    public ResponseEntity<String> create(@RequestBody GroupTeacher groupTeacher) {
        try {
            service.save(groupTeacher);
            return new ResponseEntity<>("Group teacher was created", HttpStatus.CREATED);
        } catch (Exception e) {
            logger.error("Internal server error while creating group teacher", e);
            return new ResponseEntity<>("Internal server error", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/update_group_teacher/{id}")
    public ResponseEntity<GroupTeacher> update(@PathVariable("id") Long id, @RequestBody GroupTeacher groupTeacherDetails) {
        try {
            Optional<GroupTeacher> groupTeacher = service.findById(id);
            if (groupTeacher.isPresent()) {
                GroupTeacher updatedGroupTeacher = groupTeacher.get();
                updatedGroupTeacher.setGroup(groupTeacherDetails.getGroup());
                updatedGroupTeacher.setTeacher(groupTeacherDetails.getTeacher());
                updatedGroupTeacher.setCourse(groupTeacherDetails.getCourse());
                service.save(updatedGroupTeacher);
                return new ResponseEntity<>(updatedGroupTeacher, HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            logger.error("Internal server error while updating group teacher", e);
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping("/delete_group_teacher/{id}")
    public ResponseEntity<String> delete(@PathVariable("id") Long id) {
        try {
            if (service.findById(id).isPresent()) {
                service.deleteById(id);
                return new ResponseEntity<>("Group teacher was deleted", HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            logger.error("Internal server error while deleting group teacher", e);
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}