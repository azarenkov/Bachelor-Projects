package bank

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

// Transaction represents a bank transaction
type Transaction struct {
	Type      string // "Deposit" or "Withdraw"
	Amount    float64
	Balance   float64
	Timestamp time.Time
}

// BankAccount represents a bank account
type BankAccount struct {
	AccountNumber string
	HolderName    string
	balance       float64
	transactions  []Transaction
}

// NewBankAccount creates a new bank account
func NewBankAccount(accountNumber, holderName string, initialBalance float64) *BankAccount {
	account := &BankAccount{
		AccountNumber: accountNumber,
		HolderName:    holderName,
		balance:       initialBalance,
		transactions:  make([]Transaction, 0),
	}

	// Record initial balance as a transaction
	if initialBalance > 0 {
		account.transactions = append(account.transactions, Transaction{
			Type:      "Initial Deposit",
			Amount:    initialBalance,
			Balance:   initialBalance,
			Timestamp: time.Now(),
		})
	}

	return account
}

// Deposit adds money to the account
func (b *BankAccount) Deposit(amount float64) {
	if amount <= 0 {
		fmt.Println("Deposit amount must be positive!")
		return
	}

	b.balance += amount
	transaction := Transaction{
		Type:      "Deposit",
		Amount:    amount,
		Balance:   b.balance,
		Timestamp: time.Now(),
	}
	b.transactions = append(b.transactions, transaction)
	fmt.Printf("Deposited $%.2f. New balance: $%.2f\n", amount, b.balance)
}

// Withdraw removes money from the account
func (b *BankAccount) Withdraw(amount float64) {
	if amount <= 0 {
		fmt.Println("Withdrawal amount must be positive!")
		return
	}

	if amount > b.balance {
		fmt.Println("Insufficient funds!")
		return
	}

	b.balance -= amount
	transaction := Transaction{
		Type:      "Withdraw",
		Amount:    amount,
		Balance:   b.balance,
		Timestamp: time.Now(),
	}
	b.transactions = append(b.transactions, transaction)
	fmt.Printf("Withdrew $%.2f. New balance: $%.2f\n", amount, b.balance)
}

// GetBalance returns the current balance
func (b *BankAccount) GetBalance() float64 {
	return b.balance
}

// ShowTransactionHistory displays all transactions
func (b *BankAccount) ShowTransactionHistory() {
	fmt.Println("\n=== Transaction History ===")
	if len(b.transactions) == 0 {
		fmt.Println("No transactions yet.")
		return
	}

	for i, tx := range b.transactions {
		fmt.Printf("%d. %s - $%.2f | Balance: $%.2f | Time: %s\n",
			i+1, tx.Type, tx.Amount, tx.Balance, tx.Timestamp.Format("2006-01-02 15:04:05"))
	}
	fmt.Println()
}

// RunMenu runs the interactive console menu for the bank account
func RunMenu() {
	scanner := bufio.NewScanner(os.Stdin)

	fmt.Println("\n=== Bank Account Simulation ===")
	fmt.Print("Enter Account Number: ")
	scanner.Scan()
	accountNumber := strings.TrimSpace(scanner.Text())

	fmt.Print("Enter Holder Name: ")
	scanner.Scan()
	holderName := strings.TrimSpace(scanner.Text())

	fmt.Print("Enter Initial Balance: ")
	scanner.Scan()
	initialBalance, err := strconv.ParseFloat(strings.TrimSpace(scanner.Text()), 64)
	if err != nil {
		fmt.Println("Invalid balance. Setting to 0.")
		initialBalance = 0
	}

	account := NewBankAccount(accountNumber, holderName, initialBalance)
	fmt.Printf("\nAccount created for %s with balance $%.2f\n", holderName, initialBalance)

	for {
		fmt.Println("\n=== Bank Menu ===")
		fmt.Println("1. Deposit")
		fmt.Println("2. Withdraw")
		fmt.Println("3. Check Balance")
		fmt.Println("4. Transaction History")
		fmt.Println("5. Exit")
		fmt.Print("Enter your choice: ")

		scanner.Scan()
		choice := strings.TrimSpace(scanner.Text())

		switch choice {
		case "1":
			fmt.Print("Enter deposit amount: ")
			scanner.Scan()
			amount, err := strconv.ParseFloat(strings.TrimSpace(scanner.Text()), 64)
			if err != nil {
				fmt.Println("Invalid amount.")
				continue
			}
			account.Deposit(amount)
		case "2":
			fmt.Print("Enter withdrawal amount: ")
			scanner.Scan()
			amount, err := strconv.ParseFloat(strings.TrimSpace(scanner.Text()), 64)
			if err != nil {
				fmt.Println("Invalid amount.")
				continue
			}
			account.Withdraw(amount)
		case "3":
			fmt.Printf("Current Balance: $%.2f\n", account.GetBalance())
		case "4":
			account.ShowTransactionHistory()
		case "5":
			fmt.Println("Thank you for using our bank!")
			return
		default:
			fmt.Println("Invalid choice. Please try again.")
		}
	}
}
