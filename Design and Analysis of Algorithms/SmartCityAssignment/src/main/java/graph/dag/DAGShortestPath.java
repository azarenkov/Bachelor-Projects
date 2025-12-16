package graph.dag;

import graph.Graph;
import metrics.Metrics;
import java.util.*;

public class DAGShortestPath {
    private final double[] distances;
    private final int[] parent;
    private final int source;

    public DAGShortestPath(Graph dag, int source, List<Integer> topoOrder, Metrics metrics) {
        this.source = source;
        int n = dag.getNodeCount();
        distances = new double[n];
        parent = new int[n];

        Arrays.fill(distances, Double.POSITIVE_INFINITY);
        Arrays.fill(parent, -1);
        distances[source] = 0;

        metrics.startTimer();

        for (int u : topoOrder) {
            if (distances[u] != Double.POSITIVE_INFINITY) {
                for (Graph.Edge edge : dag.getNeighbors(u)) {
                    int v = edge.to;
                    double weight = edge.weight;
                    if (distances[u] + weight < distances[v]) {
                        distances[v] = distances[u] + weight;
                        parent[v] = u;
                    }
                }
            }
        }

        metrics.stopTimer();
    }

    public double[] getDistances() {
        return distances;
    }

    public List<Integer> getPath(int destination) {
        if (distances[destination] == Double.POSITIVE_INFINITY) {
            return Collections.emptyList();
        }

        List<Integer> path = new ArrayList<>();
        Set<Integer> visited = new HashSet<>();

        for (int v = destination; v != -1; v = parent[v]) {
            if (!visited.add(v)) {
                System.err.println("Warning: Cycle detected in parent chain for node " + destination);
                return Collections.emptyList();
            }
            path.add(v);
        }

        Collections.reverse(path);
        return path;
    }

    public double getDistance(int i) {
        return distances[i];
    }
}
