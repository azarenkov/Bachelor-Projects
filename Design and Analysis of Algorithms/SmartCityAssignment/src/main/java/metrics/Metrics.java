package metrics;

import java.util.HashMap;
import java.util.Map;

/**
 * Tracks algorithm performance metrics
 */
public class Metrics {
    private String algorithmName;
    private long startTime;
    private long endTime;
    private int operations;
    private int dfsVisits;
    private int edgeExaminations;
    private int relaxations;
    private int queueOps;
    private Map<String, Object> results;

    public Metrics(String algorithmName) {
        this.algorithmName = algorithmName;
        this.results = new HashMap<>();
    }

    public void startTimer() {
        this.startTime = System.nanoTime();
    }

    public void stopTimer() {
        this.endTime = System.nanoTime();
    }

    public void recordResult(String key, Object value) {
        results.put(key, value);
    }

    public void finish() {
        this.endTime = System.nanoTime();
    }

    public void incrementDfsVisits() { dfsVisits++; }
    public void incrementEdgeExaminations() { edgeExaminations++; }
    public void incrementRelaxations() { relaxations++; }
    public void incrementQueueOps() { queueOps++; }
    public void incrementOperations() { operations++; }

    public long getElapsedNanos() {
        return endTime - startTime;
    }

    public double getElapsedMillis() {
        return getElapsedNanos() / 1_000_000.0;
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("Metrics [").append(algorithmName).append("]:\n");
        sb.append("  Time: ").append(String.format("%.3f ms", getElapsedMillis())).append("\n");
        if (dfsVisits > 0) sb.append("  DFS visits: ").append(dfsVisits).append("\n");
        if (edgeExaminations > 0) sb.append("  Edge examinations: ").append(edgeExaminations).append("\n");
        if (relaxations > 0) sb.append("  Relaxations: ").append(relaxations).append("\n");
        if (queueOps > 0) sb.append("  Queue operations: ").append(queueOps).append("\n");
        if (operations > 0) sb.append("  Operations: ").append(operations).append("\n");

        if (!results.isEmpty()) {
            results.forEach((key, value) ->
                    sb.append("  ").append(key).append(": ").append(value).append("\n")
            );
        }

        return sb.toString();
    }
}
