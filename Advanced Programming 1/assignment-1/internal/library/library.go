package library

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

// Book represents a book in the library
type Book struct {
	ID         string
	Title      string
	Author     string
	IsBorrowed bool
}

// Library represents a library with a collection of books
type Library struct {
	books map[string]Book
}

// NewLibrary creates a new library instance
func NewLibrary() *Library {
	return &Library{
		books: make(map[string]Book),
	}
}

// AddBook adds a new book to the library
func (l *Library) AddBook(id, title, author string) {
	book := Book{
		ID:         id,
		Title:      title,
		Author:     author,
		IsBorrowed: false,
	}
	l.books[id] = book
	fmt.Printf("Book '%s' added successfully!\n", title)
}

// BorrowBook marks a book as borrowed
func (l *Library) BorrowBook(id string) {
	book, exists := l.books[id]
	if !exists {
		fmt.Println("Book not found!")
		return
	}
	if book.IsBorrowed {
		fmt.Println("Book is already borrowed!")
		return
	}
	book.IsBorrowed = true
	l.books[id] = book
	fmt.Printf("Book '%s' borrowed successfully!\n", book.Title)
}

// ReturnBook marks a book as returned
func (l *Library) ReturnBook(id string) {
	book, exists := l.books[id]
	if !exists {
		fmt.Println("Book not found!")
		return
	}
	if !book.IsBorrowed {
		fmt.Println("Book was not borrowed!")
		return
	}
	book.IsBorrowed = false
	l.books[id] = book
	fmt.Printf("Book '%s' returned successfully!\n", book.Title)
}

// ListAvailableBooks lists all books that are not borrowed
func (l *Library) ListAvailableBooks() {
	fmt.Println("\n=== Available Books ===")
	hasAvailable := false
	for _, book := range l.books {
		if !book.IsBorrowed {
			fmt.Printf("ID: %s | Title: %s | Author: %s\n", book.ID, book.Title, book.Author)
			hasAvailable = true
		}
	}
	if !hasAvailable {
		fmt.Println("No available books.")
	}
	fmt.Println()
}

// RunMenu runs the interactive console menu for the library
func RunMenu() {
	library := NewLibrary()
	scanner := bufio.NewScanner(os.Stdin)

	// Add some sample books
	library.AddBook("1", "The Go Programming Language", "Alan Donovan")
	library.AddBook("2", "Clean Code", "Robert Martin")
	library.AddBook("3", "Design Patterns", "Gang of Four")

	for {
		fmt.Println("\n=== Library Management System ===")
		fmt.Println("1. Add Book")
		fmt.Println("2. Borrow Book")
		fmt.Println("3. Return Book")
		fmt.Println("4. List Available Books")
		fmt.Println("5. Exit")
		fmt.Print("Enter your choice: ")

		scanner.Scan()
		choice := strings.TrimSpace(scanner.Text())

		switch choice {
		case "1":
			fmt.Print("Enter Book ID: ")
			scanner.Scan()
			id := strings.TrimSpace(scanner.Text())

			fmt.Print("Enter Title: ")
			scanner.Scan()
			title := strings.TrimSpace(scanner.Text())

			fmt.Print("Enter Author: ")
			scanner.Scan()
			author := strings.TrimSpace(scanner.Text())

			library.AddBook(id, title, author)
		case "2":
			fmt.Print("Enter Book ID to borrow: ")
			scanner.Scan()
			id := strings.TrimSpace(scanner.Text())
			library.BorrowBook(id)
		case "3":
			fmt.Print("Enter Book ID to return: ")
			scanner.Scan()
			id := strings.TrimSpace(scanner.Text())
			library.ReturnBook(id)
		case "4":
			library.ListAvailableBooks()
		case "5":
			fmt.Println("Exiting Library System...")
			return
		default:
			fmt.Println("Invalid choice. Please try again.")
		}
	}
}
