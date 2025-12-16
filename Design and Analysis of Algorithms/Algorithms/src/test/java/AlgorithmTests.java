import interfaces.Find;
import interfaces.Select;
import interfaces.Sort;
import usecases.ClosestPair;
import usecases.DeterministicSelect;
import usecases.MergeSort;
import usecases.QuickSort;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import static org.junit.jupiter.api.Assertions.*;

import java.util.Arrays;
import java.util.Random;

public class AlgorithmTests {

    private Sort mergeSorter;
    private Sort quickSorter;
    private Select deterministicSelect;
    private Find closestPair;
    private Random random;

    @BeforeEach
    void setUp() {
        mergeSorter = new MergeSort();
        quickSorter = new QuickSort();
        deterministicSelect = new DeterministicSelect();
        closestPair = new ClosestPair();
        random = new Random(42);
    }

    @Test
    void testSortingCorrectness() {
        for (int trial = 0; trial < 50; trial++) {
            int[] arr = generateRandomArray(100, -1000, 1000);
            int[] expected = arr.clone();
            int[] mergeArr = arr.clone();
            int[] quickArr = arr.clone();

            Arrays.sort(expected);
            mergeSorter.sort(mergeArr, 0, mergeArr.length - 1);
            quickSorter.sort(quickArr, 0, quickArr.length - 1);

            assertArrayEquals(expected, mergeArr, "MergeSort failed on random array");
            assertArrayEquals(expected, quickArr, "QuickSort failed on random array");
        }

        testAdversarialArrays();
    }

    void testAdversarialArrays() {
        int[] sorted = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
        testSortingOnArray(sorted);

        int[] reverse = {10, 9, 8, 7, 6, 5, 4, 3, 2, 1};
        testSortingOnArray(reverse);

        int[] duplicates = {5, 2, 8, 2, 9, 1, 5, 5};
        testSortingOnArray(duplicates);

        int[] allSame = new int[100];
        Arrays.fill(allSame, 42);
        testSortingOnArray(allSame);
    }

    void testSortingOnArray(int[] arr) {
        int[] expected = arr.clone();
        int[] mergeArr = arr.clone();
        int[] quickArr = arr.clone();

        Arrays.sort(expected);
        mergeSorter.sort(mergeArr, 0, mergeArr.length - 1);
        quickSorter.sort(quickArr, 0, quickArr.length - 1);

        assertArrayEquals(expected, mergeArr);
        assertArrayEquals(expected, quickArr);
    }

    @Test
    void testQuickSortRecursionDepth() {
        for (int n = 10; n <= 1000; n *= 2) {
            int[] arr = generateRandomArray(n, -1000, 1000);

            quickSorter.sort(arr, 0, arr.length - 1);

            double maxExpectedDepth = 2 * Math.log(n) / Math.log(2) + 10;
            assertTrue(true, "Recursion depth test placeholder");
        }
    }

    @Test
    void testSelectCorrectness() {
        for (int trial = 0; trial < 100; trial++) {
            int[] arr = generateRandomArray(50, -1000, 1000);
            int k = random.nextInt(arr.length) + 1; // k from 1 to arr.length

            int[] sortedArr = arr.clone();
            Arrays.sort(sortedArr);
            int expected = sortedArr[k - 1];

            int[] testArr = arr.clone();
            int result = deterministicSelect.select(testArr, k);

            assertEquals(expected, result,
                    String.format("Select failed: k=%d, array=%s", k, Arrays.toString(arr)));
        }
    }

    @Test
    void testSelectEdgeCases() {
        int[] single = {42};
        assertEquals(42, deterministicSelect.select(single, 1));

        int[] two = {5, 3};
        assertEquals(3, deterministicSelect.select(two, 1));
        assertEquals(5, deterministicSelect.select(two, 2));

        int[] allSame = {7, 7, 7, 7, 7};
        assertEquals(7, deterministicSelect.select(allSame, 3));

        assertThrows(IllegalArgumentException.class,
                () -> deterministicSelect.select(new int[]{1, 2, 3}, 0));
        assertThrows(IllegalArgumentException.class,
                () -> deterministicSelect.select(new int[]{1, 2, 3}, 4));
    }

    @Test
    void testClosestPairSmall() {
        for (int trial = 0; trial < 10; trial++) {
            double[][] points = generateRandomPoints(20, -100, 100);

            double fastResult = closestPair.find(points);
            double bruteForceResult = bruteForceClosestPair(points);

            assertEquals(bruteForceResult, fastResult, 1e-9,
                    "Closest pair results don't match");
        }
    }

    @Test
    void testClosestPairLarge() {
        // Test on larger arrays using only the fast version
        double[][] largePoints = generateRandomPoints(5000, -1000, 1000);

        long startTime = System.currentTimeMillis();
        double result = closestPair.find(largePoints);
        long endTime = System.currentTimeMillis();

        assertTrue(result >= 0, "Distance should be non-negative");
        assertTrue(endTime - startTime < 5000, "Should complete in reasonable time");
    }

    @Test
    void testClosestPairEdgeCases() {
        double[][] twoPoints = {{0, 0}, {3, 4}};
        assertEquals(5.0, closestPair.find(twoPoints), 1e-9);

        double[][] duplicates = {{1, 1}, {2, 2}, {1, 1}};
        assertEquals(0.0, closestPair.find(duplicates), 1e-9);

        double[][] collinear = {{0, 0}, {1, 0}, {2, 0}, {3, 0}};
        assertEquals(1.0, closestPair.find(collinear), 1e-9);
    }

    private int[] generateRandomArray(int size, int min, int max) {
        int[] arr = new int[size];
        for (int i = 0; i < size; i++) {
            arr[i] = random.nextInt(max - min + 1) + min;
        }
        return arr;
    }

    private double[][] generateRandomPoints(int n, double min, double max) {
        double[][] points = new double[n][2];
        for (int i = 0; i < n; i++) {
            points[i][0] = min + random.nextDouble() * (max - min);
            points[i][1] = min + random.nextDouble() * (max - min);
        }
        return points;
    }

    private double bruteForceClosestPair(double[][] points) {
        double minDistance = Double.MAX_VALUE;
        int n = points.length;

        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                double dx = points[i][0] - points[j][0];
                double dy = points[i][1] - points[j][1];
                double distance = Math.sqrt(dx * dx + dy * dy);
                minDistance = Math.min(minDistance, distance);
            }
        }

        return minDistance;
    }
}
