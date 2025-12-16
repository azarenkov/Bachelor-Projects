# Algorithms Project

A Java-based collection of fundamental algorithms, showcasing efficient implementations of sorting, selection, and computational geometry techniques. This project serves as a resource for understanding algorithmic principles and their applications.

## Project Structure

The repository is organized as follows:

```
Algorithms/
├── pom.xml
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   ├── Main.java
│   │   │   ├── interfaces/
│   │   │   │   ├── Find.java
│   │   │   │   ├── Select.java
│   │   │   │   ├── Sort.java
│   │   │   ├── usecases/
│   │   │   │   ├── ClosestPair.java
│   │   │   │   ├── DeterministicSelect.java
│   │   │   │   ├── MergeSort.java
│   │   │   │   ├── QuickSort.java
```

## Implemented Algorithms

### 1. Sorting Algorithms
- **Merge Sort**: A divide-and-conquer algorithm with a time complexity of O(n log n). It splits the array into halves, sorts them, and merges them back together.
- **Quick Sort**: A highly efficient sorting algorithm with an average time complexity of O(n log n). It uses a pivot to partition the array into smaller arrays and sorts them recursively.

### 2. Selection Algorithm
- **Deterministic Select**: Finds the k-th smallest element in an array with guaranteed worst-case performance. Useful in scenarios where precise selection is critical.

### 3. Computational Geometry
- **Closest Pair of Points**: Computes the minimum distance between any two points in a 2D plane using a divide-and-conquer approach. This is a foundational algorithm in computational geometry with applications in fields like computer graphics and geographic information systems (GIS).

## Design and Architecture

### Interfaces
The project is designed using a clean architecture approach with interfaces to ensure modularity and scalability:
- **`Sort`**: Defines methods for sorting algorithms.
- **`Select`**: Defines methods for selection algorithms.
- **`Find`**: Defines methods for search and find operations.

### Dependency Management
The project uses Maven as its build automation tool. All dependencies are listed in the `pom.xml` file.

## Analysis and Insights

This project demonstrates the implementation of core algorithms in computer science. Key highlights include:
- **Efficiency**: All implemented algorithms are optimized for performance and adhere to their theoretical time complexities.
- **Modularity**: The use of interfaces ensures that new algorithms can be added with minimal changes to the existing codebase.
- **Real-world Applications**: The algorithms have applications in sorting data, selection problems, and computational geometry challenges.
