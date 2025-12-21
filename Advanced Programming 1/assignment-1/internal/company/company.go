package company

import (
	"fmt"
)

// Employee interface defines the contract for employee types
type Employee interface {
	GetDetails() string
}

// FullTimeEmployee represents a full-time employee
type FullTimeEmployee struct {
	ID     uint64
	Name   string
	Salary float64
}

// GetDetails returns the details of a full-time employee
func (f FullTimeEmployee) GetDetails() string {
	return fmt.Sprintf("Full-Time Employee - ID: %d, Name: %s, Salary: $%.2f", f.ID, f.Name, f.Salary)
}

// PartTimeEmployee represents a part-time employee
type PartTimeEmployee struct {
	ID          uint64
	Name        string
	HourlyRate  float64
	HoursWorked float64
}

// GetDetails returns the details of a part-time employee
func (p PartTimeEmployee) GetDetails() string {
	return fmt.Sprintf("Part-Time Employee - ID: %d, Name: %s, Hourly Rate: $%.2f, Hours: %.2f",
		p.ID, p.Name, p.HourlyRate, p.HoursWorked)
}

// Company represents a company with employees
type Company struct {
	name      string
	employees map[uint64]Employee
}

// NewCompany creates a new company instance
func NewCompany(name string) *Company {
	return &Company{
		name:      name,
		employees: make(map[uint64]Employee),
	}
}

// AddEmployee adds an employee to the company
func (c *Company) AddEmployee(emp Employee) {
	switch e := emp.(type) {
	case FullTimeEmployee:
		c.employees[e.ID] = emp
		fmt.Printf("Full-time employee %s added successfully!\n", e.Name)
	case PartTimeEmployee:
		c.employees[e.ID] = emp
		fmt.Printf("Part-time employee %s added successfully!\n", e.Name)
	}
}

// ListEmployees lists all employees in the company
func (c *Company) ListEmployees() {
	fmt.Printf("\n=== Employees at %s ===\n", c.name)
	if len(c.employees) == 0 {
		fmt.Println("No employees found.")
		return
	}
	for _, emp := range c.employees {
		fmt.Println(emp.GetDetails())
	}
	fmt.Println()
}

// Demo demonstrates the company package functionality
func Demo() {
	fmt.Println("\n=== Employee Management System Demo ===")

	company := NewCompany("Tech Solutions Inc.")

	// Add full-time employees
	company.AddEmployee(FullTimeEmployee{
		ID:     1001,
		Name:   "Alice Johnson",
		Salary: 75000,
	})

	company.AddEmployee(FullTimeEmployee{
		ID:     1002,
		Name:   "Bob Smith",
		Salary: 85000,
	})

	// Add part-time employees
	company.AddEmployee(PartTimeEmployee{
		ID:          2001,
		Name:        "Charlie Brown",
		HourlyRate:  25,
		HoursWorked: 20,
	})

	company.AddEmployee(PartTimeEmployee{
		ID:          2002,
		Name:        "Diana Prince",
		HourlyRate:  30,
		HoursWorked: 15,
	})

	// List all employees
	company.ListEmployees()
}
