import cli.BenchmarkRunner;
import algorithms.MaxHeap;
import metrics.PerformanceTracker;

public class Main {
    public static void main(String[] args) {
        PerformanceTracker tracker = new PerformanceTracker();
        BenchmarkRunner runner = new BenchmarkRunner(tracker);

        runner.setWarmupIterations(3);
        runner.setMeasurementIterations(10);

        int[] sizes = {100, 500, 1000, 2000, 5000};

        for (int size : sizes) {
            runner.addBenchmark(new BenchmarkRunner.Benchmark() {
                @Override
                public String getName() {
                    return "MaxHeap_Insert_" + size;
                }

                @Override
                public void run() {
                    MaxHeap heap = new MaxHeap(size);
                    for (int i = 0; i < size; i++) {
                        heap.insert(i);
                    }
                }
            });

            runner.addBenchmark(new BenchmarkRunner.Benchmark() {
                @Override
                public String getName() {
                    return "MaxHeap_ExtractMax_" + size;
                }

                @Override
                public void run() {
                    MaxHeap heap = new MaxHeap(size);
                    for (int i = 0; i < size; i++) {
                        heap.insert(i);
                    }
                    for (int i = 0; i < size; i++) {
                        heap.extractMax();
                    }
                }
            });
        }

        runner.runAll();

        tracker.exportToCSV("maxheap_benchmarks");

        System.out.println("\nBenchmark completed. Results saved to docs/performance-plots/");
    }
}
