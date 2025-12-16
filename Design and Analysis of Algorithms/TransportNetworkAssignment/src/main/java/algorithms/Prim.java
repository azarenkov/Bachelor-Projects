package algorithms;

import entities.Edge;
import java.util.*;

public class Prim {
    private int vertices;
    private List<List<Edge>> adj;
    private int operationCount;

    public Prim(int vertices) {
        this.vertices = vertices;
        this.adj = new ArrayList<>(vertices);
        for (int i = 0; i < vertices; i++) {
            adj.add(new ArrayList<>());
        }
        this.operationCount = 0;
    }

    public void addEdge(int source, int dest, int weight) {
        adj.get(source).add(new Edge(source, dest, weight));
        adj.get(dest).add(new Edge(dest, source, weight));
    }

    public List<Edge> findMST() {
        operationCount = 0;
        PriorityQueue<Edge> pq = new PriorityQueue<>(Comparator.comparingInt(e -> e.weight));
        boolean[] inMST = new boolean[vertices];
        List<Edge> mst = new ArrayList<>();

        pq.offer(new Edge(-1, 0, 0));

        while (!pq.isEmpty() && mst.size() < vertices - 1) {
            Edge edge = pq.poll();
            operationCount++; // poll operation

            if (inMST[edge.dest]) continue;

            inMST[edge.dest] = true;
            if (edge.source != -1) {
                mst.add(edge);
            }

            for (Edge e : adj.get(edge.dest)) {
                operationCount++; // comparison
                if (!inMST[e.dest]) {
                    pq.offer(e);
                }
            }
        }

        return mst;
    }

    public int getOperationCount() {
        return operationCount;
    }
}
