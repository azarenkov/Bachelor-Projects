package main

import (
	"assignment-1/internal/bank"
	"assignment-1/internal/company"
	"assignment-1/internal/library"
	"assignment-1/internal/shapes"
	"fmt"
	"strings"
)

func main() {
	fmt.Println("=== Advanced Programming Assignment 1 ===")

	for {
		fmt.Println("\n=== Main Menu ===")
		fmt.Println("1. Exercise 1: Library Management System")
		fmt.Println("2. Exercise 2: Shapes & Interfaces")
		fmt.Println("3. Exercise 3: Employee Management System")
		fmt.Println("4. Exercise 4: Bank Account Simulation")
		fmt.Println("5. Exit")
		fmt.Print("Select an exercise (1-5): ")

		var choice string
		fmt.Scanln(&choice)
		choice = strings.TrimSpace(choice)

		switch choice {
		case "1":
			library.RunMenu()
		case "2":
			shapes.Demo()
			fmt.Println("\nPress Enter to continue...")
			fmt.Scanln()
		case "3":
			company.Demo()
			fmt.Println("\nPress Enter to continue...")
			fmt.Scanln()
		case "4":
			bank.RunMenu()
		case "5":
			fmt.Println("Goodbye!")
			return
		default:
			fmt.Println("Invalid choice. Please select 1-5.")
		}
	}
}
