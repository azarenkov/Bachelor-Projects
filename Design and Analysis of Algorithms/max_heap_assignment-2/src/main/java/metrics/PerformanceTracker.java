package metrics;

import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

public final class PerformanceTracker {
    private final List<PerformanceMetric> metrics;
    private final String outputDirectory;

    public PerformanceTracker() {
        this.metrics = new ArrayList<>();
        this.outputDirectory = "docs/performance-plots";
    }

    public PerformanceTracker(String outputDirectory) {
        this.metrics = new ArrayList<>();
        this.outputDirectory = outputDirectory;
    }

    public void recordMetric(String operation, long executionTimeNanos, int dataSize) {
        metrics.add(new PerformanceMetric(operation, executionTimeNanos, dataSize, System.currentTimeMillis()));
    }

    public void recordMetric(String operation, double averageTimeNanos, long minTimeNanos, long maxTimeNanos, int iterations) {
        metrics.add(new PerformanceMetric(operation, averageTimeNanos, minTimeNanos, maxTimeNanos, iterations, System.currentTimeMillis()));
    }

    public void exportToCSV() {
        exportToCSV("performance_metrics");
    }

    public void exportToCSV(String filename) {
        try {
            Files.createDirectories(Paths.get(outputDirectory));

            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss"));
            String fullPath = outputDirectory + "/" + filename + "_" + timestamp + ".csv";

            try (PrintWriter writer = new PrintWriter(new FileWriter(fullPath))) {
                writer.println("Operation,Average_ms,Min_ms,Max_ms,Data_Size,Iterations,Timestamp");

                for (PerformanceMetric metric : metrics) {
                    writer.printf("%s,%.3f,%.3f,%.3f,%d,%d,%d%n",
                            metric.getOperation(),
                            metric.getAverageTimeMs(),
                            metric.getMinTimeMs(),
                            metric.getMaxTimeMs(),
                            metric.getDataSize(),
                            metric.getIterations(),
                            metric.getTimestamp()
                    );
                }
            }

            System.out.println("Performance metrics exported to: " + fullPath);
        } catch (IOException e) {
            System.err.println("Error exporting metrics: " + e.getMessage());
        }
    }

    public void clear() {
        metrics.clear();
    }

    public List<PerformanceMetric> getMetrics() {
        return new ArrayList<>(metrics);
    }

    public static class PerformanceMetric {
        private final String operation;
        private final double averageTimeNanos;
        private final long minTimeNanos;
        private final long maxTimeNanos;
        private final int dataSize;
        private final int iterations;
        private final long timestamp;

        public PerformanceMetric(String operation, long executionTimeNanos, int dataSize, long timestamp) {
            this.operation = operation;
            this.averageTimeNanos = executionTimeNanos;
            this.minTimeNanos = executionTimeNanos;
            this.maxTimeNanos = executionTimeNanos;
            this.dataSize = dataSize;
            this.iterations = 1;
            this.timestamp = timestamp;
        }

        public PerformanceMetric(String operation, double averageTimeNanos, long minTimeNanos, long maxTimeNanos, int iterations, long timestamp) {
            this.operation = operation;
            this.averageTimeNanos = averageTimeNanos;
            this.minTimeNanos = minTimeNanos;
            this.maxTimeNanos = maxTimeNanos;
            this.dataSize = 0;
            this.iterations = iterations;
            this.timestamp = timestamp;
        }

        public String getOperation() { return operation; }
        public double getAverageTimeMs() { return averageTimeNanos / 1_000_000.0; }
        public double getMinTimeMs() { return minTimeNanos / 1_000_000.0; }
        public double getMaxTimeMs() { return maxTimeNanos / 1_000_000.0; }
        public int getDataSize() { return dataSize; }
        public int getIterations() { return iterations; }
        public long getTimestamp() { return timestamp; }
    }
}
