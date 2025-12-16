package org.example.controllers;

import org.example.models.Group;
import org.example.services.interfaces.GroupServiceInterface;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/v1/groups")
public class GroupController {
    private final GroupServiceInterface service;

    public GroupController(GroupServiceInterface service) {
        this.service = service;
    }

    @GetMapping("/get_all_groups")
    public ResponseEntity<List<Group>> getAll() {
        try {
            List<Group> groups = service.getAll();
            return new ResponseEntity<>(groups, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/get_group_by_id/{id}")
    public ResponseEntity<Group> getById(@PathVariable("id") Long id) {
        try {
            Group group = service.getById(id);
            return new ResponseEntity<>(group, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/create_group")
    public ResponseEntity<String> create(@RequestBody Group group) {
        try {
            service.create(group);
            return new ResponseEntity<>("Group was created", HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>("Internal server error", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping("/delete_group_by_id/{id}")
    public ResponseEntity<String> deleteById(@PathVariable("id") Long id) {
        try {
            service.delete(id);
            return new ResponseEntity<>("Group was deleted", HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}