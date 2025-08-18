package com.example.TeamTrack_backend.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
public class TestController {
    
    public TestController() {
        System.out.println("🎯 TestController constructor called - controller is being instantiated!");
    }
    
    @GetMapping("/hello")
    public String hello() {
        System.out.println("🎯 TestController.hello called");
        return "Hello from TestController!";
    }
}
