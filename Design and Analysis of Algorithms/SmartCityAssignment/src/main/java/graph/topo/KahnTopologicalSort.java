package graph.topo;

import graph.Graph;
import metrics.Metrics;

import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import java.util.Queue;

public class KahnTopologicalSort {
    private List<Integer> order;

    public KahnTopologicalSort(Graph graph, Metrics metrics) {
        metrics.startTimer();
        this.order = kahnSort(graph);
        metrics.stopTimer();

        if (order != null) {
            metrics.recordResult("Nodes sorted", order.size());
        }
    }

    private List<Integer> kahnSort(Graph graph) {
        int n = graph.getNodeCount();
        int[] inDegree = new int[n];

        // Calculate in-degrees
        for (int u = 0; u < n; u++) {
            for (Graph.Edge edge : graph.getNeighbors(u)) {
                inDegree[edge.to]++;
            }
        }

        // Find all nodes with in-degree 0
        Queue<Integer> queue = new LinkedList<>();
        for (int i = 0; i < n; i++) {
            if (inDegree[i] == 0) {
                queue.offer(i);
            }
        }

        List<Integer> result = new ArrayList<>();

        while (!queue.isEmpty()) {
            int u = queue.poll();
            result.add(u);

            for (Graph.Edge edge : graph.getNeighbors(u)) {
                int v = edge.to;
                inDegree[v]--;
                if (inDegree[v] == 0) {
                    queue.offer(v);
                }
            }
        }

        // Check if all nodes were processed (no cycle)
        return result.size() == n ? result : null;
    }

    public List<Integer> getOrder() {
        return order;
    }

    public boolean isDAG() {
        return order != null;
    }

}