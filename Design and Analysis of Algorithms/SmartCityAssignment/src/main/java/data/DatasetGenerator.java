package data;

import com.google.gson.*;
import java.io.*;
import java.nio.file.*;
import java.util.*;

/**
 * Generates test datasets for Smart City Scheduling
 */
public class DatasetGenerator {
    private static final Random random = new Random(42);

    public static void generateAllDatasets() {
        try {
            Files.createDirectories(Paths.get("data"));

            // Small datasets (6-10 nodes)
            generateDataset("small_dag", 8, 12, false, false, 1.0);
            generateDataset("small_cycle", 7, 10, true, false, 1.0);
            generateDataset("small_mixed", 10, 18, true, false, 1.0);

            // Medium datasets (10-20 nodes)
            generateDataset("medium_sparse", 15, 20, true, false, 0.15);
            generateDataset("medium_dense", 12, 50, true, true, 0.4);
            generateDataset("medium_multi_scc", 18, 35, true, false, 0.2);

            // Large datasets (20-50 nodes)
            generateDataset("large_sparse", 30, 45, true, false, 0.08);
            generateDataset("large_dense", 25, 180, true, true, 0.3);
            generateDataset("large_complex", 40, 120, true, false, 0.1);

            System.out.println("Generated 9 datasets in data/ directory");

        } catch (IOException e) {
            System.err.println("Error generating datasets: " + e.getMessage());
        }
    }

    /**
     * Generate a single dataset
     *
     * @param name filename (without .json)
     * @param nodes number of nodes
     * @param edges approximate number of edges
     * @param weighted whether to add edge weights
     * @param allowCycles whether to allow cycles
     * @param density edge density factor
     */
    private static void generateDataset(String name, int nodes, int edges,
                                        boolean weighted, boolean allowCycles,
                                        double density) throws IOException {
        JsonObject json = new JsonObject();
        json.addProperty("name", name);
        json.addProperty("nodes", nodes);
        json.addProperty("description",
                String.format("n=%d, e~%d, weighted=%s, cycles=%s",
                        nodes, edges, weighted, allowCycles));

        JsonArray edgesArray = new JsonArray();
        Set<String> addedEdges = new HashSet<>();
        int edgeCount = 0;

        if (allowCycles) {
            // Create some strongly connected components
            int numSCCs = 2 + random.nextInt(3);
            int nodesPerSCC = Math.max(1, nodes / numSCCs);

            // Create cycles within SCCs
            for (int scc = 0; scc < numSCCs; scc++) {
                int start = scc * nodesPerSCC;
                int end = (scc == numSCCs - 1) ? nodes : Math.min(nodes, (scc + 1) * nodesPerSCC);

                if (start >= end) continue;

                // Create a cycle
                for (int i = start; i < end - 1; i++) {
                    addEdge(edgesArray, addedEdges, i, i + 1, weighted);
                    edgeCount++;
                }
                if (end - start > 2) {
                    addEdge(edgesArray, addedEdges, end - 1, start, weighted);
                    edgeCount++;
                }

                // Add some random edges within SCC
                int internalEdges = (int)((end - start) * density);
                for (int i = 0; i < internalEdges; i++) {
                    int from = start + random.nextInt(end - start);
                    int to = start + random.nextInt(end - start);
                    if (from != to) {
                        addEdge(edgesArray, addedEdges, from, to, weighted);
                        edgeCount++;
                    }
                }
            }

            // Add edges between SCCs (forward only to avoid extra cycles)
            int betweenEdges = edges - edgeCount;
            for (int i = 0; i < betweenEdges && edgeCount < edges; i++) {
                int fromSCC = random.nextInt(numSCCs);
                int toSCC = random.nextInt(numSCCs);
                if (fromSCC < toSCC) {
                    int fromStart = fromSCC * nodesPerSCC;
                    int fromEnd = (fromSCC == numSCCs - 1) ? nodes : Math.min(nodes, (fromSCC + 1) * nodesPerSCC);
                    int toStart = toSCC * nodesPerSCC;
                    int toEnd = (toSCC == numSCCs - 1) ? nodes : Math.min(nodes, (toSCC + 1) * nodesPerSCC);

                    if (fromStart < fromEnd && toStart < toEnd) {
                        int from = fromStart + random.nextInt(fromEnd - fromStart);
                        int to = toStart + random.nextInt(toEnd - toStart);
                        addEdge(edgesArray, addedEdges, from, to, weighted);
                        edgeCount++;
                    }
                }
            }

        } else {
            // Create a DAG using topological layers
            int layers = Math.min(nodes, 3 + random.nextInt(4));
            int nodesPerLayer = Math.max(1, nodes / layers);

            // Add edges from earlier layers to later layers
            for (int i = 0; i < nodes && edgeCount < edges; i++) {
                int fromLayer = Math.min(i / nodesPerLayer, layers - 1);
                int numEdges = 1 + random.nextInt(3);

                for (int j = 0; j < numEdges && edgeCount < edges; j++) {
                    int remainingLayers = layers - fromLayer - 1;
                    if (remainingLayers <= 0) break;

                    int toLayer = fromLayer + 1 + random.nextInt(remainingLayers);
                    int toStart = toLayer * nodesPerLayer;
                    int toEnd = (toLayer == layers - 1) ? nodes : Math.min(nodes, (toLayer + 1) * nodesPerLayer);

                    if (toStart < toEnd && toEnd <= nodes) {
                        int to = toStart + random.nextInt(toEnd - toStart);
                        if (to < nodes && to > i) {
                            addEdge(edgesArray, addedEdges, i, to, weighted);
                            edgeCount++;
                        }
                    }
                }
            }
        }

        json.add("edges", edgesArray);

        // Write to file
        String filename = "data/" + name + ".json";
        try (FileWriter writer = new FileWriter(filename)) {
            Gson gson = new GsonBuilder().setPrettyPrinting().create();
            gson.toJson(json, writer);
        }

        System.out.println("Generated: " + filename + " (" + edgeCount + " edges)");
    }

    private static void addEdge(JsonArray edges, Set<String> addedEdges,
                                int from, int to, boolean weighted) {
        String key = from + "->" + to;
        if (!addedEdges.contains(key)) {
            JsonArray edge = new JsonArray();
            edge.add(from);
            edge.add(to);
            if (weighted) {
                edge.add(1 + random.nextInt(10)); // Weight 1-10
            }
            edges.add(edge);
            addedEdges.add(key);
        }
    }

    /**
     * Generate a simple test case manually
     */
    public static void generateSimpleTest() throws IOException {
        JsonObject json = new JsonObject();
        json.addProperty("name", "simple_test");
        json.addProperty("nodes", 6);
        json.addProperty("description", "Simple test with 2 SCCs");

        JsonArray edges = new JsonArray();
        // SCC 1: 0 -> 1 -> 2 -> 0
        edges.add(createEdge(0, 1, 2));
        edges.add(createEdge(1, 2, 3));
        edges.add(createEdge(2, 0, 1));

        // SCC 2: 3 -> 4 -> 3
        edges.add(createEdge(3, 4, 2));
        edges.add(createEdge(4, 3, 2));

        // Node 5 (singleton)

        // Cross-SCC edges
        edges.add(createEdge(2, 3, 4));
        edges.add(createEdge(4, 5, 3));

        json.add("edges", edges);

        try (FileWriter writer = new FileWriter("data/simple_test.json")) {
            Gson gson = new GsonBuilder().setPrettyPrinting().create();
            gson.toJson(json, writer);
        }
    }

    private static JsonArray createEdge(int from, int to, int weight) {
        JsonArray edge = new JsonArray();
        edge.add(from);
        edge.add(to);
        edge.add(weight);
        return edge;
    }
}