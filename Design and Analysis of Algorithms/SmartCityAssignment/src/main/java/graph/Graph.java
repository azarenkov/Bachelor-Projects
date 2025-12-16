package graph;

import com.google.gson.*;
import java.io.*;
import java.util.*;

/**
 * Directed graph with optional edge weights
 */
public class Graph {
    private int nodeCount;
    private List<List<Edge>> adjList;
    private boolean weighted;

    public Graph(int nodeCount, boolean weighted) {
        this.nodeCount = nodeCount;
        this.weighted = weighted;
        this.adjList = new ArrayList<>(nodeCount);
        for (int i = 0; i < nodeCount; i++) {
            adjList.add(new ArrayList<>());
        }
    }

    public void addEdge(int from, int to, double weight) {
        adjList.get(from).add(new Edge(to, weight));
    }

    public void addEdge(int from, int to) {
        addEdge(from, to, 1.0);
    }

    public List<Edge> getNeighbors(int node) {
        return adjList.get(node);
    }

    public int getNodeCount() {
        return nodeCount;
    }

    public int getEdgeCount() {
        return adjList.stream().mapToInt(List::size).sum();
    }

    public boolean isWeighted() {
        return weighted;
    }

    /**
     * Load graph from JSON file
     * Expected format: {"nodes": n, "edges": [[from, to, weight?], ...]}
     */
    public static Graph fromJson(String filename) throws IOException {
        Gson gson = new Gson();
        JsonObject json = gson.fromJson(new FileReader(filename), JsonObject.class);

        int nodes = json.get("nodes").getAsInt();
        JsonArray edgesArray = json.getAsJsonArray("edges");

        boolean weighted = edgesArray.size() > 0 &&
                edgesArray.get(0).getAsJsonArray().size() > 2;

        Graph graph = new Graph(nodes, weighted);

        for (JsonElement elem : edgesArray) {
            JsonArray edge = elem.getAsJsonArray();
            int from = edge.get(0).getAsInt();
            int to = edge.get(1).getAsInt();
            double weight = weighted ? edge.get(2).getAsDouble() : 1.0;
            graph.addEdge(from, to, weight);
        }

        return graph;
    }

    public double getWeight(int from, int to) {
        for (Edge edge : adjList.get(from)) {
            if (edge.to == to) {
                return edge.weight;
            }
        }
        return Double.POSITIVE_INFINITY; // No edge exists
    }

    public static class Edge {
        public final int to;
        public final double weight;

        public Edge(int to, double weight) {
            this.to = to;
            this.weight = weight;
        }
    }
}