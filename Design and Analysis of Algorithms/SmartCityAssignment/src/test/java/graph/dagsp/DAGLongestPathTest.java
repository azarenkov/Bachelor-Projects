package graph.dagsp;

import graph.Graph;
import graph.dag.DAGLongestPath;
import graph.topo.KahnTopologicalSort;
import metrics.Metrics;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

public class DAGLongestPathTest {

    @Test
    public void testLinearLongest() {
        Graph graph = new Graph(4, true);
        graph.addEdge(0, 1, 2.0);
        graph.addEdge(1, 2, 3.0);
        graph.addEdge(2, 3, 1.0);

        Metrics topoMetrics = new Metrics("Topo");
        KahnTopologicalSort topo = new KahnTopologicalSort(graph, topoMetrics);
        List<Integer> order = topo.getOrder();

        Metrics lpMetrics = new Metrics("LP");
        DAGLongestPath lp = new DAGLongestPath(graph, 0, order, lpMetrics);

        assertEquals(6.0, lp.getLongestDistance(3), 0.001);
        assertEquals(3, lp.getCriticalPathEnd());
    }

    @Test
    public void testDiamondLongest() {
        // Should choose longer path 0 -> 2 -> 3
        Graph graph = new Graph(4, true);
        graph.addEdge(0, 1, 1.0);
        graph.addEdge(0, 2, 3.0);
        graph.addEdge(1, 3, 1.0);
        graph.addEdge(2, 3, 4.0);

        Metrics topoMetrics = new Metrics("Topo");
        KahnTopologicalSort topo = new KahnTopologicalSort(graph, topoMetrics);
        List<Integer> order = topo.getOrder();

        Metrics lpMetrics = new Metrics("LP");
        DAGLongestPath lp = new DAGLongestPath(graph, 0, order, lpMetrics);

        assertEquals(7.0, lp.getLongestDistance(3), 0.001); // 0->2->3

        List<Integer> path = lp.getPath(3);
        assertEquals(Arrays.asList(0, 2, 3), path);
    }
}