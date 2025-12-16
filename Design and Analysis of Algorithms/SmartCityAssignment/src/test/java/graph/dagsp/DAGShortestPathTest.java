package graph.dagsp;

import graph.Graph;
import graph.dag.DAGShortestPath;
import graph.topo.KahnTopologicalSort;
import metrics.Metrics;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

public class DAGShortestPathTest {

    @Test
    public void testLinearPath() {
        // 0 -> 1 (w=2) -> 2 (w=3) -> 3 (w=1)
        Graph graph = new Graph(4, true);
        graph.addEdge(0, 1, 2.0);
        graph.addEdge(1, 2, 3.0);
        graph.addEdge(2, 3, 1.0);

        Metrics topoMetrics = new Metrics("Topo");
        KahnTopologicalSort topo = new KahnTopologicalSort(graph, topoMetrics);
        List<Integer> order = topo.getOrder();

        Metrics spMetrics = new Metrics("SP");
        DAGShortestPath sp = new DAGShortestPath(graph, 0, order, spMetrics);

        assertEquals(0.0, sp.getDistance(0), 0.001);
        assertEquals(2.0, sp.getDistance(1), 0.001);
        assertEquals(5.0, sp.getDistance(2), 0.001);
        assertEquals(6.0, sp.getDistance(3), 0.001);
    }

    @Test
    public void testDiamondPath() {
        // 0 -> 1 (w=4), 0 -> 2 (w=2), 1 -> 3 (w=1), 2 -> 3 (w=5)
        Graph graph = new Graph(4, true);
        graph.addEdge(0, 1, 4.0);
        graph.addEdge(0, 2, 2.0);
        graph.addEdge(1, 3, 1.0);
        graph.addEdge(2, 3, 5.0);

        Metrics topoMetrics = new Metrics("Topo");
        KahnTopologicalSort topo = new KahnTopologicalSort(graph, topoMetrics);
        List<Integer> order = topo.getOrder();

        Metrics spMetrics = new Metrics("SP");
        DAGShortestPath sp = new DAGShortestPath(graph, 0, order, spMetrics);

        assertEquals(0.0, sp.getDistance(0), 0.001);
        assertEquals(4.0, sp.getDistance(1), 0.001);
        assertEquals(2.0, sp.getDistance(2), 0.001);
        assertEquals(5.0, sp.getDistance(3), 0.001); // Via 0->1->3
    }

    @Test
    public void testPathReconstruction() {
        Graph graph = new Graph(4, true);
        graph.addEdge(0, 1, 1.0);
        graph.addEdge(1, 2, 1.0);
        graph.addEdge(2, 3, 1.0);

        Metrics topoMetrics = new Metrics("Topo");
        KahnTopologicalSort topo = new KahnTopologicalSort(graph, topoMetrics);
        List<Integer> order = topo.getOrder();

        Metrics spMetrics = new Metrics("SP");
        DAGShortestPath sp = new DAGShortestPath(graph, 0, order, spMetrics);

        List<Integer> path = sp.getPath(3);
        assertNotNull(path);
        assertEquals(Arrays.asList(0, 1, 2, 3), path);
    }
}