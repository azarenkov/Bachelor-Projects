package graph.scc;

import graph.Graph;
import metrics.Metrics;

import java.util.*;

/**
 * Tarjan's algorithm for finding Strongly Connected Components
 * Time complexity: O(V + E)
 */
public class TarjanSCC {
    private Graph graph;
    private Metrics metrics;

    private int[] ids;           // Node IDs (discovery time)
    private int[] low;           // Low-link values
    private boolean[] onStack;
    private Stack<Integer> stack;
    private int id;
    private int sccCount;

    private List<List<Integer>> components;
    private int[] componentId;   // Maps node -> component ID

    /**
     * Find all SCCs in the graph using Tarjan's algorithm
     */
    public TarjanSCC(Graph graph, Metrics metrics) {
        this.graph = graph;
        this.metrics = metrics;

        int n = graph.getNodeCount();
        this.ids = new int[n];
        this.low = new int[n];
        this.onStack = new boolean[n];
        this.stack = new Stack<>();
        this.componentId = new int[n];
        this.components = new ArrayList<>();

        Arrays.fill(ids, -1);
        Arrays.fill(componentId, -1);

        // Run DFS from each unvisited node
        for (int i = 0; i < n; i++) {
            if (ids[i] == -1) {
                dfs(i);
            }
        }

        metrics.finish();
    }

    private void dfs(int at) {
        metrics.incrementDfsVisits();

        ids[at] = low[at] = id++;
        stack.push(at);
        onStack[at] = true;

        // Visit neighbors
        for (Graph.Edge edge : graph.getNeighbors(at)) {
            int to = edge.to;
            metrics.incrementEdgeExaminations();

            if (ids[to] == -1) {
                // Unvisited node
                dfs(to);
                low[at] = Math.min(low[at], low[to]);
            } else if (onStack[to]) {
                // Node is in current SCC
                low[at] = Math.min(low[at], ids[to]);
            }
        }

        // Found SCC root
        if (ids[at] == low[at]) {
            List<Integer> component = new ArrayList<>();
            while (true) {
                int node = stack.pop();
                onStack[node] = false;
                component.add(node);
                componentId[node] = sccCount;
                if (node == at) break;
            }
            components.add(component);
            sccCount++;
        }
    }

    /**
     * Get all strongly connected components
     */
    public List<List<Integer>> getComponents() {
        return components;
    }

    /**
     * Get the component ID for a node
     */
    public int getComponentId(int node) {
        return componentId[node];
    }

    /**
     * Build condensation graph (DAG of SCCs)
     */
    public Graph buildCondensation() {
        Graph condensation = new Graph(sccCount, graph.isWeighted());
        Set<String> addedEdges = new HashSet<>();

        for (int u = 0; u < graph.getNodeCount(); u++) {
            int compU = componentId[u];

            for (Graph.Edge edge : graph.getNeighbors(u)) {
                int v = edge.to;
                int compV = componentId[v];

                // Add edge between different components (no self-loops)
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

    /**
     * Derive task order from component order
     */
    public List<Integer> deriveTaskOrder(List<Integer> componentOrder) {
        List<Integer> taskOrder = new ArrayList<>();

        for (int compId : componentOrder) {
            // Add all tasks from this component
            List<Integer> component = components.get(compId);
            taskOrder.addAll(component);
        }

        return taskOrder;
    }
}