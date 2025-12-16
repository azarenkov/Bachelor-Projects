package algorithms;

import entities.Edge;
import java.util.*;

public class Kruskal {
    private int vertices;
    private List<Edge> edges;
    private int operationCount;

    public Kruskal(int vertices) {
        this.vertices = vertices;
        this.edges = new ArrayList<>();
        this.operationCount = 0;
    }

    public void addEdge(int source, int dest, int weight) {
        edges.add(new Edge(source, dest, weight));
    }

    public List<Edge> findMST() {
        operationCount = 0;
        Collections.sort(edges, Comparator.comparingInt(e -> e.weight));
        operationCount += edges.size(); // sorting operations

        int[] parent = new int[vertices];
        int[] rank = new int[vertices];
        for (int i = 0; i < vertices; i++) {
            parent[i] = i;
        }

        List<Edge> mst = new ArrayList<>();

        for (Edge edge : edges) {
            operationCount++; // comparison
            int x = find(parent, edge.source);
            int y = find(parent, edge.dest);

            if (x != y) {
                mst.add(edge);
                union(parent, rank, x, y);
            }

            if (mst.size() == vertices - 1) break;
        }

        return mst;
    }

    private int find(int[] parent, int i) {
        operationCount++; // find operation
        if (parent[i] != i) {
            parent[i] = find(parent, parent[i]);
        }
        return parent[i];
    }

    private void union(int[] parent, int[] rank, int x, int y) {
        operationCount++; // union operation
        int xroot = find(parent, x);
        int yroot = find(parent, y);

        if (rank[xroot] < rank[yroot]) {
            parent[xroot] = yroot;
        } else if (rank[xroot] > rank[yroot]) {
            parent[yroot] = xroot;
        } else {
            parent[yroot] = xroot;
            rank[xroot]++;
        }
    }

    public int getOperationCount() {
        return operationCount;
    }
}
