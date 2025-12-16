package algorithms;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;

public class MaxHeapTest {
    private MaxHeap heap;

    @BeforeEach
    void setUp() {
        heap = new MaxHeap(10);
    }

    @Test
    @DisplayName("Test heap initialization")
    void testHeapInitialization() {
        assertEquals(0, heap.size());
        assertTrue(heap.isEmpty());
    }

    @Test
    @DisplayName("Test single element insertion and extraction")
    void testSingleElement() {
        heap.insert(42);
        assertEquals(1, heap.size());
        assertFalse(heap.isEmpty());
        assertEquals(42, heap.extractMax());
        assertEquals(0, heap.size());
        assertTrue(heap.isEmpty());
    }

    @Test
    @DisplayName("Test max heap property after insertions")
    void testMaxHeapProperty() {
        int[] values = {5, 10, 3, 8, 1, 15, 7};
        for (int value : values) {
            heap.insert(value);
        }

        // Extract all elements - should come out in descending order
        int[] expected = {15, 10, 8, 7, 5, 3, 1};
        for (int expectedValue : expected) {
            assertEquals(expectedValue, heap.extractMax());
        }
    }

    @Test
    @DisplayName("Test heap with duplicate values")
    void testDuplicateValues() {
        heap.insert(5);
        heap.insert(5);
        heap.insert(10);
        heap.insert(5);
        heap.insert(10);

        assertEquals(10, heap.extractMax());
        assertEquals(10, heap.extractMax());
        assertEquals(5, heap.extractMax());
        assertEquals(5, heap.extractMax());
        assertEquals(5, heap.extractMax());
    }

    @Test
    @DisplayName("Test heap capacity")
    void testHeapCapacity() {
        MaxHeap smallHeap = new MaxHeap(3);
        smallHeap.insert(1);
        smallHeap.insert(2);
        smallHeap.insert(3);

        // Heap should be full
        assertEquals(3, smallHeap.size());

        // Try to insert beyond capacity - should handle gracefully
        assertDoesNotThrow(() -> smallHeap.insert(4));
    }

    @Test
    @DisplayName("Test extract from empty heap")
    void testExtractFromEmptyHeap() {
        assertThrows(RuntimeException.class, () -> heap.extractMax());
    }

    @Test
    @DisplayName("Test large number of operations")
    void testLargeOperations() {
        MaxHeap largeHeap = new MaxHeap(1000);

        // Insert 100 random values
        int[] values = new int[100];
        for (int i = 0; i < 100; i++) {
            values[i] = (int) (Math.random() * 1000);
            largeHeap.insert(values[i]);
        }

        assertEquals(100, largeHeap.size());

        // Extract all and verify they come out in non-increasing order
        int prev = Integer.MAX_VALUE;
        for (int i = 0; i < 100; i++) {
            int current = largeHeap.extractMax();
            assertTrue(current <= prev, "Heap property violated: " + current + " > " + prev);
            prev = current;
        }

        assertTrue(largeHeap.isEmpty());
    }

    @Test
    @DisplayName("Test alternating insert and extract operations")
    void testAlternatingOperations() {
        heap.insert(10);
        heap.insert(5);
        assertEquals(10, heap.extractMax());

        heap.insert(15);
        heap.insert(8);
        assertEquals(15, heap.extractMax());
        assertEquals(8, heap.extractMax());
        assertEquals(5, heap.extractMax());
    }

    @Test
    @DisplayName("Test heap with negative numbers")
    void testNegativeNumbers() {
        heap.insert(-5);
        heap.insert(-10);
        heap.insert(0);
        heap.insert(-1);

        assertEquals(0, heap.extractMax());
        assertEquals(-1, heap.extractMax());
        assertEquals(-5, heap.extractMax());
        assertEquals(-10, heap.extractMax());
    }

    @Test
    @DisplayName("Test heap stress test")
    void testStressTest() {
        MaxHeap stressHeap = new MaxHeap(1000);

        // Insert many elements
        for (int i = 0; i < 500; i++) {
            stressHeap.insert(i);
        }

        // Extract half
        for (int i = 0; i < 250; i++) {
            int max = stressHeap.extractMax();
            assertTrue(max >= 250, "Expected value >= 250, got " + max);
        }

        // Insert more
        for (int i = 500; i < 750; i++) {
            stressHeap.insert(i);
        }

        // Verify heap property is maintained
        int prev = Integer.MAX_VALUE;
        while (!stressHeap.isEmpty()) {
            int current = stressHeap.extractMax();
            assertTrue(current <= prev, "Heap property violated");
            prev = current;
        }
    }

    @Test
    @DisplayName("Test heap with same elements")
    void testAllSameElements() {
        for (int i = 0; i < 5; i++) {
            heap.insert(42);
        }

        for (int i = 0; i < 5; i++) {
            assertEquals(42, heap.extractMax());
        }
    }

    @Test
    @DisplayName("Test heap size consistency")
    void testSizeConsistency() {
        assertEquals(0, heap.size());

        for (int i = 1; i <= 5; i++) {
            heap.insert(i);
            assertEquals(i, heap.size());
        }

        for (int i = 4; i >= 0; i--) {
            heap.extractMax();
            assertEquals(i, heap.size());
        }
    }
}
