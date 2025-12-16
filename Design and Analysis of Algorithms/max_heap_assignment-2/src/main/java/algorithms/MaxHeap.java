package algorithms;

public final class MaxHeap {
    private final int[] Heap;
    private int size;
    private int maxsize;

    public MaxHeap(int maxsize) {
        this.maxsize = maxsize;
        this.size = 0;
        Heap = new int[this.maxsize];
    }

    private int parent(int pos) {
        return (pos - 1) / 2;
    }

    private int leftChild(int pos) {
        return (2 * pos) + 1;
    }

    private int rightChild(int pos) {
        return (2 * pos) + 2;
    }

    private boolean isLeaf(int pos) {
        if (pos >= (size / 2) && pos < size) {
            return true;
        }
        return false;
    }

    private void swap(int fpos, int spos) {
        int tmp;
        tmp = Heap[fpos];
        Heap[fpos] = Heap[spos];
        Heap[spos] = tmp;
    }

    private void maxHeapify(int pos) {
        if (isLeaf(pos)) return;

        int leftChild = leftChild(pos);
        int rightChild = rightChild(pos);

        boolean needsHeapify = false;
        if (leftChild < size && Heap[pos] < Heap[leftChild]) {
            needsHeapify = true;
        }
        if (rightChild < size && Heap[pos] < Heap[rightChild]) {
            needsHeapify = true;
        }

        if (needsHeapify) {
            if (rightChild >= size || Heap[leftChild] > Heap[rightChild]) {
                swap(pos, leftChild);
                maxHeapify(leftChild);
            } else {
                swap(pos, rightChild);
                maxHeapify(rightChild);
            }
        }
    }


    public void insert(int value) {
        if (size >= Heap.length) {
            System.out.println("Heap is full, cannot insert " + value);
            return;
        }

        Heap[size] = value;
        size++;
        heapifyUp(size - 1);
    }


    private void heapifyUp(int pos) {
        int current = pos;
        while (current > 0 && Heap[current] > Heap[parent(current)]) {
            swap(current, parent(current));
            current = parent(current);
        }
    }


    public void print() {

        for (int i = 0; i < size / 2; i++) {

            System.out.print("Parent Node : " + Heap[i]);

            if (leftChild(i) < size) System.out.print(" Left Child Node: " + Heap[leftChild(i)]);

            if (rightChild(i) < size) System.out.print(" Right Child Node: " + Heap[rightChild(i)]);

            System.out.println();
        }
    }


    public int extractMax() {
        int popped = Heap[0];
        Heap[0] = Heap[--size];
        maxHeapify(0);
        return popped;
    }

    public int size() {
        return this.size;
    }

    public boolean isEmpty() {
        return this.size == 0;
    }
}
