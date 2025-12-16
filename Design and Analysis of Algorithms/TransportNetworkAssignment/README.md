## 1. Summary of Input Data and Results

This report analyzes two Minimum Spanning Tree (MST) algorithms — **Prim’s** and **Kruskal’s** — applied to two graphs.  
For each case, the algorithms’ results, total weights, number of operations, and execution times are summarized below.

---

### **Graph 1**

- **Vertices:** 5  
- **Edges:** 7  

| Algorithm | MST Edges | Total Weight | Operations | Execution Time (ms) |
|------------|------------|---------------|-------------|----------------------|
| **Prim’s** | A–C (3), C–B (2), B–D (5), D–E (6) | **16** | **20** | **7** |
| **Kruskal’s** | B–C (2), A–C (3), B–D (5), D–E (6) | **16** | **37** | **0** |

**Observation:**  
Both algorithms produced the same MST weight (**16**). Prim’s algorithm performed **17 fewer operations**, but had a slightly longer execution time (7 ms).  
Kruskal’s algorithm, while operation-heavy, executed faster for this dataset.

---

### **Graph 2**

- **Vertices:** 4  
- **Edges:** 5  

| Algorithm | MST Edges | Total Weight | Operations | Execution Time (ms) |
|------------|------------|---------------|-------------|----------------------|
| **Prim’s** | A–B (1), B–C (2), C–D (3) | **6** | **14** | **0** |
| **Kruskal’s** | A–B (1), B–C (2), C–D (3) | **6** | **25** | **0** |

**Observation:**  
Both algorithms generated identical MSTs with total weight **6**.  
Prim’s algorithm again required fewer operations (**14** vs **25**) and matched Kruskal’s in execution time (**0 ms**).

---

## 2. Comparison of Prim’s and Kruskal’s Algorithms

| Criterion | **Prim’s Algorithm** | **Kruskal’s Algorithm** |
|------------|----------------------|--------------------------|
| **Approach** | Expands MST by adding the nearest vertex not yet in the tree. | Builds MST by sorting edges and adding them if no cycle is formed. |
| **Operation Count** | Lower (14–20 in tests). | Higher (25–37 in tests). |
| **Execution Time** | Slightly slower on small datasets. | Extremely fast (0 ms in tests). |
| **Efficiency on Sparse Graphs** | More efficient, avoids sorting all edges. | Slightly less efficient due to sorting overhead. |
| **Efficiency on Dense Graphs** | Less efficient without optimized heaps. | Can be efficient with optimized union–find. |
| **Implementation Complexity** | Moderate (requires priority queue). | Simpler (uses sorting and union–find). |

---

## 3. Conclusions

- Both algorithms successfully produced **identical MSTs** across all tested graphs.  
- **Prim’s algorithm** showed **lower operation counts**, making it more suitable for smaller or sparse graphs.  
- **Kruskal’s algorithm**, while performing more operations, had **better or equal runtime** due to simpler edge-based logic and efficient sorting.  

### **When to Use Each Algorithm**

| Scenario | Recommended Algorithm |
|-----------|------------------------|
| **Dense graphs (many edges)** | **Prim’s** — fewer comparisons when adjacency list/matrix is available. |
| **Sparse graphs (few edges)** | **Kruskal’s** — simple, efficient edge-based approach. |
| **Large datasets requiring scalability** | **Kruskal’s**, especially with Union–Find optimization. |
| **Graphs stored as adjacency matrices** | **Prim’s**, due to direct vertex expansion. |

---
