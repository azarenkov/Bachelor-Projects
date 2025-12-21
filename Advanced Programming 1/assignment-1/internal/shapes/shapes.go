package shapes

import (
	"fmt"
	"math"
)

// Shape interface defines methods for geometric shapes
type Shape interface {
	Area() float64
	Perimeter() float64
}

// Rectangle represents a rectangle shape
type Rectangle struct {
	Width  float64
	Height float64
}

// Area calculates the area of a rectangle
func (r Rectangle) Area() float64 {
	return r.Width * r.Height
}

// Perimeter calculates the perimeter of a rectangle
func (r Rectangle) Perimeter() float64 {
	return 2 * (r.Width + r.Height)
}

// Circle represents a circle shape
type Circle struct {
	Radius float64
}

// Area calculates the area of a circle
func (c Circle) Area() float64 {
	return math.Pi * c.Radius * c.Radius
}

// Perimeter calculates the perimeter (circumference) of a circle
func (c Circle) Perimeter() float64 {
	return 2 * math.Pi * c.Radius
}

// Square represents a square shape
type Square struct {
	Side float64
}

// Area calculates the area of a square
func (s Square) Area() float64 {
	return s.Side * s.Side
}

// Perimeter calculates the perimeter of a square
func (s Square) Perimeter() float64 {
	return 4 * s.Side
}

// Triangle represents a triangle shape
type Triangle struct {
	SideA float64
	SideB float64
	SideC float64
}

// Area calculates the area of a triangle using Heron's formula
func (t Triangle) Area() float64 {
	s := (t.SideA + t.SideB + t.SideC) / 2
	return math.Sqrt(s * (s - t.SideA) * (s - t.SideB) * (s - t.SideC))
}

// Perimeter calculates the perimeter of a triangle
func (t Triangle) Perimeter() float64 {
	return t.SideA + t.SideB + t.SideC
}

// PrintShapeInfo prints the area and perimeter of a shape
func PrintShapeInfo(s Shape, name string) {
	fmt.Printf("\n%s:\n", name)
	fmt.Printf("  Area: %.2f\n", s.Area())
	fmt.Printf("  Perimeter: %.2f\n", s.Perimeter())
}

// Demo demonstrates the shapes package functionality
func Demo() {
	fmt.Println("\n=== Shapes & Interfaces Demo ===")

	// Create a slice of shapes
	shapes := []Shape{
		Rectangle{Width: 5, Height: 10},
		Circle{Radius: 7},
		Square{Side: 6},
		Triangle{SideA: 3, SideB: 4, SideC: 5},
	}

	// Shape names for display
	names := []string{"Rectangle", "Circle", "Square", "Triangle"}

	// Iterate through shapes and print their properties
	for i, shape := range shapes {
		PrintShapeInfo(shape, names[i])
	}

	// Calculate total area of all shapes
	totalArea := 0.0
	for _, shape := range shapes {
		totalArea += shape.Area()
	}
	fmt.Printf("\nTotal Area of all shapes: %.2f\n", totalArea)
}
