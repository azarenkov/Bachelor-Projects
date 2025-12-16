package graph.dag;

import graph.Graph;
import metrics.Metrics;
import java.util.*;

public class DAGLongestPath {
    private final double[] distances;
    private final int[] parent;
    private final int source;

    public DAGLongestPath(Graph dag, int source, List<Integer> topoOrder, Metrics metrics) {
        this.source = source;
        int n = dag.getNodeCount();
        distances = new double[n];
        parent = new int[n];

        Arrays.fill(distances, Double.NEGATIVE_INFINITY);
        Arrays.fill(parent, -1);
        distances[source] = 0;

        metrics.startTimer();

        for (int u : topoOrder) {
            if (distances[u] != Double.NEGATIVE_INFINITY) {
                for (Graph.Edge edge : dag.getNeighbors(u)) {
                    int v = edge.to;
                    double weight = edge.weight;
                    if (distances[u] + weight > distances[v]) {
                        distances[v] = distances[u] + weight;
                        parent[v] = u;
                    }
                }
            }
        }

        metrics.stopTimer();
    }

    public int getCriticalPathEnd() {
        int maxNode = -1;
        double maxDist = Double.NEGATIVE_INFINITY;
        for (int i = 0; i < distances.length; i++) {
            if (distances[i] > maxDist && distances[i] != Double.NEGATIVE_INFINITY) {
                maxDist = distances[i];
                maxNode = i;
            }
        }
        return maxNode;
    }

    public double getLongestDistance(int node) {
        return distances[node];
    }

    public List<Integer> getPath(int destination) {
        if (distances[destination] == Double.NEGATIVE_INFINITY) {
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
}
