# Smart City Scheduling System

**Assignment 4**: Strongly Connected Components, Topological Sort, and DAG Shortest Paths

## Overview

This project implements graph algorithms for smart city task scheduling:
- **SCC Detection**: Tarjan's and Kosaraju's algorithms
- **Topological Sort**: Kahn's algorithm (BFS) and DFS-based
- **DAG Shortest/Longest Paths**: Single-source paths with path reconstruction

## Project Structure

```
smart-city-scheduling/
├── src/
│   ├── main/java/
│   │   ├── Main.java                    # Entry point
│   │   ├── graph/
│   │   │   ├── Graph.java               # Graph data structure
│   │   │   ├── scc/
│   │   │   │   ├── TarjanSCC.java       # Tarjan's SCC algorithm
│   │   │   │   └── KosarajuSCC.java     # Kosaraju's SCC algorithm
│   │   │   ├── topo/
│   │   │   │   ├── KahnTopologicalSort.java
│   │   │   │   └── DFSTopologicalSort.java
│   │   │   └── dagsp/
│   │   │       ├── DAGShortestPath.java
│   │   │       ├── DAGLongestPath.java
│   │   │       └── DAGAllPairsShortestPath.java
│   │   ├── metrics/
│   │   │   └── Metrics.java             # Performance tracking
│   │   └── data/
│   │       └── DatasetGenerator.java    # Test data generation
│   └── test/java/
│       └── graph/
│           ├── scc/TarjanSCCTest.java
│           ├── topo/TopologicalSortTest.java
│           └── dagsp/
│               ├── DAGShortestPathTest.java
│               └── DAGLongestPathTest.java
├── data/                                # Generated datasets (9 files)
├── pom.xml                              # Maven configuration
└── README.md
```

## Requirements

- **Java**: JDK 11 or higher
- **Maven**: 3.6+ (or use included wrapper)
- **Libraries**: Gson 2.10.1, JUnit 5.9.3

## Building and Running

### Clone and Build
```bash
git clone <your-repo-url>
cd smart-city-scheduling
mvn clean compile
```

### Generate Datasets
Datasets are automatically generated on first run, or manually:
```bash
mvn exec:java -Dexec.mainClass="data.DatasetGenerator"
```

### Run Main Program
```bash
mvn exec:java -Dexec.mainClass="Main"
```

### Run Tests
```bash
mvn test
```

### Run with IDE
Import as Maven project in IntelliJ IDEA, Eclipse, or VSCode with Java extensions.

## Dataset Details

| Category | Size | Description | Files |
|----------|------|-------------|-------|
| **Small** | 6-10 nodes | Simple structures, 1-2 cycles or pure DAG | 3 |
| **Medium** | 10-20 nodes | Mixed structures, multiple SCCs | 3 |
| **Large** | 20-50 nodes | Performance testing, complex graphs | 3 |

### Generated Datasets
1. **small_dag.json** - Pure DAG, 8 nodes
2. **small_cycle.json** - Single large SCC, 7 nodes
3. **small_mixed.json** - Mixed cycles and DAG, 10 nodes
4. **medium_sparse.json** - Low density, 15 nodes
5. **medium_dense.json** - High density, 12 nodes
6. **medium_multi_scc.json** - Multiple SCCs, 18 nodes
7. **large_sparse.json** - Sparse graph, 30 nodes
8. **large_dense.json** - Dense graph, 25 nodes
9. **large_complex.json** - Complex structure, 40 nodes

### JSON Format
```json
{
  "name": "dataset_name",
  "nodes": 10,
  "description": "Description",
  "edges": [
    [0, 1, 2.5],  // from, to, weight (optional)
    [1, 2, 3.0],
    ...
  ]
}
```

## Algorithm Implementation

### 1. Strongly Connected Components (Tarjan)

**Complexity**: O(V + E)

```java
TarjanSCC scc = new TarjanSCC(graph, metrics);
List<List<Integer>> components = scc.getComponents();
Graph condensation = scc.buildCondensation();
```

**Key Features**:
- Single DFS pass
- Uses low-link values
- Detects SCCs during traversal
- Builds condensation DAG

### 2. Topological Sort (Kahn)

**Complexity**: O(V + E)

```java
KahnTopologicalSort topo = new KahnTopologicalSort(condensation, metrics);
List<Integer> order = topo.getOrder();
```

**Key Features**:
- BFS-based approach
- In-degree tracking
- Queue-based processing
- Cycle detection

### 3. DAG Shortest Paths

**Complexity**: O(V + E)

```java
DAGShortestPath sp = new DAGShortestPath(graph, source, topoOrder, metrics);
double distance = sp.getDistance(target);
List<Integer> path = sp.getPath(target);
```

**Key Features**:
- Uses topological order
- Single pass relaxation
- Path reconstruction
- Handles disconnected nodes

### 4. DAG Longest Paths (Critical Path)

**Complexity**: O(V + E)

```java
DAGLongestPath lp = new DAGLongestPath(graph, source, topoOrder, metrics);
int criticalEnd = lp.getCriticalPathEnd();
List<Integer> criticalPath = lp.getPath(criticalEnd);
```

**Key Features**:
- Maximum distance calculation
- Critical path detection
- Project scheduling applications

## Performance Metrics

The `Metrics` class tracks:
- **Execution time** (nanoseconds/milliseconds)
- **DFS visits** (SCC algorithms)
- **Edge examinations** (all algorithms)
- **Relaxations** (shortest/longest path)
- **Queue operations** (Kahn's algorithm)

## Testing

JUnit 5 tests cover:
- **Edge cases**: Empty graphs, single nodes, disconnected graphs
- **Correctness**: Known results, constraint validation
- **Cycles**: Detection and handling
- **Paths**: Shortest, longest, reconstruction

Run specific test class:
```bash
mvn test -Dtest=TarjanSCCTest
```

## Maven Configuration (pom.xml)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.smartcity</groupId>
    <artifactId>scheduling</artifactId>
    <version>1.0-SNAPSHOT</version>

    <properties>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <dependencies>
        <!-- Gson for JSON parsing -->
        <dependency>
            <groupId>com.google.code.gson</groupId>
            <artifactId>gson</artifactId>
            <version>2.10.1</version>
        </dependency>

        <!-- JUnit 5 for testing -->
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter-api</artifactId>
            <version>5.9.3</version>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter-engine</artifactId>
            <version>5.9.3</version>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <!-- Compiler plugin -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.11.0</version>
            </plugin>

            <!-- Surefire for tests -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-surefire-plugin</artifactId>
                <version>3.0.0</version>
            </plugin>

            <!-- Exec plugin for running main -->
            <plugin>
                <groupId>org.codehaus.mojo</groupId>
                <artifactId>exec-maven-plugin</artifactId>
                <version>3.1.0</version>
                <configuration>
                    <mainClass>Main</mainClass>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

## Analysis and Results

### Bottlenecks

1. **SCC (Tarjan)**: DFS visits dominate for sparse graphs
2. **Topological Sort**: Queue operations scale with edge density
3. **DAG-SP**: Edge relaxations increase with path multiplicity

### Effect of Graph Structure

- **Dense graphs**: More edge examinations, higher constants
- **Large SCCs**: Fewer components but deeper recursion
- **Sparse graphs**: Linear-time performance closer to O(V)

### Practical Recommendations

| Task | Best Algorithm | When to Use |
|------|----------------|-------------|
| Find cycles | Tarjan SCC | Need cycle detection + compression |
| Order tasks | Kahn Topo | Clear in-degree semantics |
| Critical path | DAG Longest | Project scheduling, PERT |
| Resource allocation | DAG Shortest | Minimize costs/time |

## Grading Checklist

- [x] **SCC Implementation** (Tarjan/Kosaraju)
- [x] **Condensation Graph** construction
- [x] **Topological Sort** (Kahn/DFS)
- [x] **DAG Shortest Paths** with reconstruction
- [x] **DAG Longest Paths** (critical path)
- [x] **9 Datasets** (small/medium/large)
- [x] **Metrics** tracking (time, operations)
- [x] **JUnit Tests** (edge cases, correctness)
- [x] **Code Quality** (packages, comments, Javadoc)
- [x] **README** with instructions
- [x] **Git Repository** structure

## Author

Azarenkov Alexey