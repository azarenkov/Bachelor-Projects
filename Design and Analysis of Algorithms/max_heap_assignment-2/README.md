# Max Heap Assignment

This repository contains an implementation of a **Max Heap** data structure in Java. The Max Heap is a widely-used data structure, particularly in scenarios where retrieving the maximum value efficiently is required. This implementation is designed for educational purposes and focuses on illustrating the algorithm, efficiency, and practical use cases of Max Heaps.

## Project Overview

The goal of this project is to:

- **Understand** the fundamental properties of Max Heaps.
- **Implement** core operations like insertion, deletion, and heapify.
- **Benchmark** the performance of the heap operations to understand their time complexity.
- **Track** the project's progress and improvements.

This project is part of an academic assignment, but it can also serve as a starting point for those new to data structures or those looking to explore the Java programming language.

---

## Algorithm Details

### What is a Max Heap?

A Max Heap is a **complete binary tree** where:
1. Every parent node is greater than or equal to its child nodes.
2. The largest element is always at the root of the tree.

### Core Operations

1. **Insertion**:
   - Insert the element at the end of the tree (maintain the completeness property).
   - Bubble up the element to restore the heap property.

2. **Deletion (Remove Maximum)**:
   - Replace the root (maximum element) with the last element of the heap.
   - Bubble down the root to restore the heap property.

3. **Heapify**:
   - A utility function to build a heap from an unsorted array.

4. **Peek**:
   - Retrieve the maximum element without removing it.

### Time Complexity

| Operation       | Time Complexity |
|------------------|-----------------|
| Insert           | O(log n)       |
| Delete Max       | O(log n)       |
| Peek             | O(1)           |
| Build Heap       | O(n)           |

---

## Benchmarking

To evaluate the efficiency and correctness of the Max Heap implementation, this project includes benchmarking tests that measure the execution time of different operations under varying workloads.

### Benchmark Setup

- **Environment**:
  - JDK 8 or higher.
  - A machine with at least 4 GB of RAM and a modern CPU.

- **Test Cases**:
  - Inserting 10,000, 100,000, and 1,000,000 elements into the heap.
  - Removing the maximum element repeatedly until the heap is empty.
  - Building a heap from a large unsorted array.

- **Metrics**:
  - Time taken for each operation.
  - Memory usage.

---

## Project Tracker

### Progress and Milestones

- [x] Implement basic heap operations (insert, delete, peek).
- [x] Add utility functions (heapify, build heap).
- [x] Create test cases for correctness.
- [x] Add benchmarking tests for performance evaluation.
- [ ] Enhance the benchmarking framework to include memory profiling.
- [ ] Optimize the heap for larger datasets.
- [ ] Add visualizations of heap operations (e.g., using graph libraries).

### Tracking Issues

To track issues and further improvements, visit the [Issues](https://github.com/azarenkov/max_heap_assignment-2/issues) section of this repository.

---

## How to Use

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/azarenkov/max_heap_assignment-2.git
   cd max_heap_assignment-2
   ```

2. **Open the Project in an IDE**:
   Use IntelliJ IDEA, Eclipse, or any text editor of your choice.

3. **Run the Code**:
   Compile and execute the main program to test the Max Heap implementation.

4. **Run Unit Tests**:
   Ensure the correctness of the implementation by running the provided unit tests.

---

## Contributing

Contributions are welcome! If you find a bug or have an idea for improvement, please create an issue or submit a pull request.

### Steps to Contribute

1. Fork this repository.
2. Create a new branch for your feature or bug fix:
   ```bash
   git checkout -b feature-name
   ```
3. Commit your changes and push the branch:
   ```bash
   git commit -m "Add feature-name"
   git push origin feature-name
   ```
4. Submit a pull request for review.

## Author

Created and maintained by [azarenkov](https://github.com/azarenkov).
