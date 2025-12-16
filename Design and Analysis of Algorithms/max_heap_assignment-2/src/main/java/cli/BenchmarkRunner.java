package cli;

import metrics.PerformanceTracker;
import java.util.ArrayList;
import java.util.List;

public final class BenchmarkRunner {
    private final List<Benchmark> benchmarks;
    private final PerformanceTracker tracker;
    private int warmupIterations = 3;
    private int measurementIterations = 10;

    public BenchmarkRunner(PerformanceTracker tracker) {
        this.benchmarks = new ArrayList<>();
        this.tracker = tracker;
    }

    public void setWarmupIterations(int warmupIterations) {
        this.warmupIterations = warmupIterations;
    }

    public void setMeasurementIterations(int measurementIterations) {
        this.measurementIterations = measurementIterations;
    }

    public void addBenchmark(Benchmark benchmark) {
        benchmarks.add(benchmark);
    }

    public void runAll() {
        for (Benchmark benchmark : benchmarks) {
            runBenchmark(benchmark);
        }
    }

    private void runBenchmark(Benchmark benchmark) {
        System.out.println("Running benchmark: " + benchmark.getName());

        System.out.println("Warming up...");
        for (int i = 0; i < warmupIterations; i++) {
            benchmark.run();
        }

        System.out.println("Measuring...");
        List<Long> times = new ArrayList<>();
        for (int i = 0; i < measurementIterations; i++) {
            long startTime = System.nanoTime();
            benchmark.run();
            long endTime = System.nanoTime();
            times.add(endTime - startTime);
        }

        long sum = times.stream().mapToLong(Long::longValue).sum();
        double average = (double) sum / times.size();
        long min = times.stream().mapToLong(Long::longValue).min().orElse(0);
        long max = times.stream().mapToLong(Long::longValue).max().orElse(0);

        tracker.recordMetric(benchmark.getName(), average, min, max, measurementIterations);

        System.out.printf("Average: %.3f ms, Min: %.3f ms, Max: %.3f ms%n%n",
                average / 1_000_000.0, min / 1_000_000.0, max / 1_000_000.0);
    }

    public interface Benchmark {
        String getName();
        void run();
    }
}
