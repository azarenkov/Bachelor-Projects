import graph.Graph;
import graph.dag.DAGLongestPath;
import graph.dag.DAGShortestPath;
import graph.scc.*;
import data.*;
import graph.topo.KahnTopologicalSort;
import metrics.*;
import java.io.*;
import java.nio.file.*;
import java.util.*;

/**
 * Smart City Scheduling System
 * Processes task dependencies using SCC, Topological Sort, and DAG Shortest Paths
 */
public class Main {
    public static void main(String[] args) {
        System.out.println("=== Smart City Scheduling System ===\n");

        // Generate datasets if data directory doesn't exist or is empty
        Path dataDir = Paths.get("data");
        if (!Files.exists(dataDir) || isEmptyDirectory(dataDir)) {
            System.out.println("Generating datasets...\n");
            DatasetGenerator.generateAllDatasets();
        }

        // Process all JSON files in data directory
        try {
            Files.list(dataDir)
                    .filter(p -> p.toString().endsWith(".json"))
                    .sorted()
                    .forEach(Main::processDataset);
        } catch (IOException e) {
            System.err.println("Error reading data directory: " + e.getMessage());
        }
    }

    private static boolean isEmptyDirectory(Path dir) {
        try (var stream = Files.list(dir)) {
            return stream.findAny().isEmpty();
        } catch (IOException e) {
            return true;
        }
    }

    private static void processDataset(Path path) {
        System.out.println("\n" + "=".repeat(70));
        System.out.println("Processing: " + path.getFileName());
        System.out.println("=".repeat(70));

        try {
            // Load graph
            Graph graph = Graph.fromJson(path.toString());
            System.out.println("\nGraph Info:");
            System.out.println("  Nodes: " + graph.getNodeCount());
            System.out.println("  Edges: " + graph.getEdgeCount());
            System.out.println("  Weighted: " + graph.isWeighted());

            // 1. SCC Detection using Tarjan's algorithm
            System.out.println("\n--- Strongly Connected Components (Tarjan) ---");
            Metrics sccMetrics = new Metrics("SCC-Tarjan");
            TarjanSCC scc = new TarjanSCC(graph, sccMetrics);

            List<List<Integer>> components = scc.getComponents();
            System.out.println("Found " + components.size() + " SCCs:");
            for (int i = 0; i < components.size(); i++) {
                List<Integer> comp = components.get(i);
                System.out.println("  SCC " + i + ": " + comp + " (size: " + comp.size() + ")");
            }
            System.out.println("\n" + sccMetrics);

            // Build condensation graph (DAG of components)
            Graph condensation = scc.buildCondensation();
            System.out.println("\nCondensation DAG:");
            System.out.println("  Component nodes: " + condensation.getNodeCount());
            System.out.println("  Component edges: " + condensation.getEdgeCount());

            // 2. Topological Sort on condensation DAG
            System.out.println("\n--- Topological Sort (Kahn's Algorithm) ---");
            Metrics topoMetrics = new Metrics("Topological-Sort");
            KahnTopologicalSort topo = new KahnTopologicalSort(condensation, topoMetrics);

            List<Integer> componentOrder = topo.getOrder();
            if (componentOrder != null) {
                System.out.println("Component order: " + componentOrder);
                System.out.println("\n" + topoMetrics);

                // Derive original task order from component order
                List<Integer> taskOrder = scc.deriveTaskOrder(componentOrder);
                System.out.println("\nDerived task order: " + taskOrder);

                // 3. DAG Shortest and Longest Paths
                System.out.println("\n--- DAG Shortest & Longest Paths ---");
                processPaths(condensation, componentOrder, graph);
            } else {
                System.out.println("ERROR: Condensation is not a DAG (contains cycles)!");
            }

        } catch (Exception e) {
            System.err.println("Error processing dataset: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private static void processPaths(Graph dag, List<Integer> topoOrder, Graph originalGraph) {
        if (dag.getNodeCount() == 0) return;

        int source = topoOrder.get(0); // Use first node in topo order as source

        // Shortest paths
        Metrics spMetrics = new Metrics("DAG-Shortest-Path");
        DAGShortestPath sp = new DAGShortestPath(dag, source, topoOrder, spMetrics);

        System.out.println("Shortest paths from source " + source + ":");
        double[] distances = sp.getDistances();
        for (int v = 0; v < distances.length; v++) {
            if (distances[v] != Double.POSITIVE_INFINITY) {
                List<Integer> path = sp.getPath(v);
                System.out.printf("  To %d: distance=%.2f, path=%s%n", v, distances[v], path);
            }
        }
        System.out.println("\n" + spMetrics);

        // Longest path (critical path)
        Metrics lpMetrics = new Metrics("DAG-Longest-Path");
        DAGLongestPath lp = new DAGLongestPath(dag, source, topoOrder, lpMetrics);

        System.out.println("\nCritical (Longest) Path:");
        int criticalEnd = lp.getCriticalPathEnd();
        double criticalLength = lp.getLongestDistance(criticalEnd);
        List<Integer> criticalPath = lp.getPath(criticalEnd);
        System.out.printf("  Critical path: %s%n", criticalPath);
        System.out.printf("  Length: %.2f%n", criticalLength);
        System.out.println("\n" + lpMetrics);
    }
}
