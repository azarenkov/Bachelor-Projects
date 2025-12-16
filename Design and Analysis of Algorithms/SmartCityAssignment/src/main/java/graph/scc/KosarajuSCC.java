package graph.scc;

import graph.Graph;
import metrics.Metrics;
import java.util.*;

/**
 * Kosaraju's algorithm for finding Strongly Connected Components
 * Time complexity: O(V + E)
 */
public class KosarajuSCC {
    private Graph graph;
    private Metrics metrics;

    private boolean[] visited;
    private Stack<Integer> finishStack;
    private int[] componentId;
    private List<List<Integer>> components;
    private int sccCount;

    public KosarajuSCC(Graph graph, Metrics metrics) {
        this.graph = graph;
        this.metrics = metrics;

        int n = graph.getNodeCount();
        this.visited = new boolean[n];
        this.finishStack = new Stack<>();
        this.componentId = new int[n];
        this.components = new ArrayList<>();

        Arrays.fill(componentId, -1);

        // Step 1: Fill finish stack with DFS on original graph
        for (int i = 0; i < n; i++) {
            if (!visited[i]) {
                dfs1(i);
            }
        }

        // Step 2: Transpose graph
        Graph transposed = transposeGraph();

        // Step 3: DFS on transposed graph in reverse finish order
        Arrays.fill(visited, false);
        while (!finishStack.isEmpty()) {
            int v = finishStack.pop();
            if (!visited[v]) {
                List<Integer> component = new ArrayList<>();
                dfs2(transposed, v, component);
                components.add(component);
                sccCount++;
            }
        }

        metrics.finish();
    }

    private void dfs1(int u) {
        metrics.incrementDfsVisits();
        visited[u] = true;

        for (Graph.Edge edge : graph.getNeighbors(u)) {
            metrics.incrementEdgeExaminations();
            if (!visited[edge.to]) {
                dfs1(edge.to);
            }
        }

        finishStack.push(u);
    }

    private void dfs2(Graph g, int u, List<Integer> component) {
        metrics.incrementDfsVisits();
        visited[u] = true;
        component.add(u);
        componentId[u] = sccCount;

        for (Graph.Edge edge : g.getNeighbors(u)) {
            metrics.incrementEdgeExaminations();
            if (!visited[edge.to]) {
                dfs2(g, edge.to, component);
            }
        }
    }

    private Graph transposeGraph() {
        int n = graph.getNodeCount();
        Graph transposed = new Graph(n, graph.isWeighted());

        for (int u = 0; u < n; u++) {
            for (Graph.Edge edge : graph.getNeighbors(u)) {
                transposed.addEdge(edge.to, u, edge.weight);
            }
        }

        return transposed;
    }

    public List<List<Integer>> getComponents() {
        return components;
    }

    public int getComponentId(int node) {
        return componentId[node];
    }

    public Graph buildCondensation() {
        Graph condensation = new Graph(sccCount, graph.isWeighted());
        Set<String> addedEdges = new HashSet<>();

        for (int u = 0; u < graph.getNodeCount(); u++) {
            int compU = componentId[u];

            for (Graph.Edge edge : graph.getNeighbors(u)) {
                int v = edge.to;
                int compV = componentId[v];

                if (compU != compV) {
                    String edgeKey = compU + "->" + compV;
                    if (!addedEdges.contains(edgeKey)) {
                        condensation.addEdge(compU, compV, edge.weight);
                        addedEdges.add(edgeKey);
                    }
                }
            }
        }

        return condensation;
    }

    public List<Integer> deriveTaskOrder(List<Integer> componentOrder) {
        List<Integer> taskOrder = new ArrayList<>();
        for (int compId : componentOrder) {
            taskOrder.addAll(components.get(compId));
        }
        return taskOrder;
    }
}