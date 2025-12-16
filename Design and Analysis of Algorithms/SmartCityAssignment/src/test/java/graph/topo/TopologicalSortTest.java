package graph.topo;

import graph.Graph;
import metrics.Metrics;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

public class TopologicalSortTest {

    @Test
    public void testLinearDAG() {
        // 0 -> 1 -> 2 -> 3
        Graph graph = new Graph(4, false);
        graph.addEdge(0, 1);
        graph.addEdge(1, 2);
        graph.addEdge(2, 3);

        Metrics metrics = new Metrics("Test");
        KahnTopologicalSort topo = new KahnTopologicalSort(graph, metrics);

        List<Integer> order = topo.getOrder();
        assertNotNull(order);
        assertEquals(4, order.size());
        assertEquals(0, order.get(0));
        assertEquals(3, order.get(3));
    }

    @Test
    public void testDiamondDAG() {
        // 0 -> 1,2 -> 3
        Graph graph = new Graph(4, false);
        graph.addEdge(0, 1);
        graph.addEdge(0, 2);
        graph.addEdge(1, 3);
        graph.addEdge(2, 3);

        Metrics metrics = new Metrics("Test");
        KahnTopologicalSort topo = new KahnTopologicalSort(graph, metrics);

        List<Integer> order = topo.getOrder();
        assertNotNull(order);
        assertEquals(4, order.size());

        // Check constraints
        assertTrue(order.indexOf(0) < order.indexOf(1));
        assertTrue(order.indexOf(0) < order.indexOf(2));
        assertTrue(order.indexOf(1) < order.indexOf(3));
        assertTrue(order.indexOf(2) < order.indexOf(3));
    }

    @Test
    public void testCycleDetection() {
        // Graph with cycle: 0 -> 1 -> 2 -> 0
        Graph graph = new Graph(3, false);
        graph.addEdge(0, 1);
        graph.addEdge(1, 2);
        graph.addEdge(2, 0);

        Metrics metrics = new Metrics("Test");
        KahnTopologicalSort topo = new KahnTopologicalSort(graph, metrics);

        assertNull(topo.getOrder()); // Should detect cycle
        assertFalse(topo.isDAG());
    }

    @Test
    public void testSingleNode() {
        Graph graph = new Graph(1, false);

        Metrics metrics = new Metrics("Test");
        KahnTopologicalSort topo = new KahnTopologicalSort(graph, metrics);

        List<Integer> order = topo.getOrder();
        assertNotNull(order);
        assertEquals(1, order.size());
        assertEquals(0, order.get(0));
    }

    @Test
    public void testEmptyGraph() {
        Graph graph = new Graph(0, false);

        Metrics metrics = new Metrics("Test");
        KahnTopologicalSort topo = new KahnTopologicalSort(graph, metrics);

        List<Integer> order = topo.getOrder();
        assertNotNull(order);
        assertEquals(0, order.size());
    }
}