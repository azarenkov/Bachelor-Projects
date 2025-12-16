package graph.scc;

import graph.Graph;
import metrics.Metrics;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

public class TarjanSCCTest {

    @Test
    public void testSimpleCycle() {
        // Graph: 0 -> 1 -> 2 -> 0
        Graph graph = new Graph(3, false);
        graph.addEdge(0, 1);
        graph.addEdge(1, 2);
        graph.addEdge(2, 0);

        Metrics metrics = new Metrics("Test");
        TarjanSCC scc = new TarjanSCC(graph, metrics);

        List<List<Integer>> components = scc.getComponents();
        assertEquals(1, components.size());
        assertEquals(3, components.get(0).size());
    }

    @Test
    public void testTwoSCCs() {
        // Two SCCs: {0,1,2} and {3,4}
        // 0 -> 1 -> 2 -> 0 -> 3 -> 4 -> 3
        Graph graph = new Graph(5, false);
        graph.addEdge(0, 1);
        graph.addEdge(1, 2);
        graph.addEdge(2, 0);
        graph.addEdge(0, 3);
        graph.addEdge(3, 4);
        graph.addEdge(4, 3);

        Metrics metrics = new Metrics("Test");
        TarjanSCC scc = new TarjanSCC(graph, metrics);

        List<List<Integer>> components = scc.getComponents();
        assertEquals(2, components.size());
    }

    @Test
    public void testDAG() {
        // Pure DAG: 0 -> 1 -> 2, 0 -> 2
        Graph graph = new Graph(3, false);
        graph.addEdge(0, 1);
        graph.addEdge(1, 2);
        graph.addEdge(0, 2);

        Metrics metrics = new Metrics("Test");
        TarjanSCC scc = new TarjanSCC(graph, metrics);

        List<List<Integer>> components = scc.getComponents();
        assertEquals(3, components.size()); // Each node is its own SCC
    }

    @Test
    public void testCondensation() {
        // Graph with 2 SCCs
        Graph graph = new Graph(5, true);
        graph.addEdge(0, 1, 2.0);
        graph.addEdge(1, 2, 3.0);
        graph.addEdge(2, 0, 1.0);
        graph.addEdge(2, 3, 4.0);
        graph.addEdge(3, 4, 2.0);
        graph.addEdge(4, 3, 2.0);

        Metrics metrics = new Metrics("Test");
        TarjanSCC scc = new TarjanSCC(graph, metrics);
        Graph condensation = scc.buildCondensation();

        assertEquals(2, condensation.getNodeCount());
        assertTrue(condensation.getEdgeCount() > 0);
    }

    @Test
    public void testSingleNode() {
        Graph graph = new Graph(1, false);

        Metrics metrics = new Metrics("Test");
        TarjanSCC scc = new TarjanSCC(graph, metrics);

        List<List<Integer>> components = scc.getComponents();
        assertEquals(1, components.size());
        assertEquals(1, components.get(0).size());
    }

    @Test
    public void testDisconnectedGraph() {
        // Two disconnected nodes
        Graph graph = new Graph(2, false);

        Metrics metrics = new Metrics("Test");
        TarjanSCC scc = new TarjanSCC(graph, metrics);

        List<List<Integer>> components = scc.getComponents();
        assertEquals(2, components.size());
    }
}
