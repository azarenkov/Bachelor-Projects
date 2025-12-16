package usecases;

import interfaces.Select;
import java.util.ArrayList;
import java.util.Arrays;

public final class DeterministicSelect implements Select {

    @Override
    public int select(int[] arr, int k) {
        if (k < 1 || k > arr.length) {
            throw new IllegalArgumentException("k is out of bounds");
        }
        return select(arr, 0, arr.length - 1, k - 1);
    }

    private int select(int[] arr, int start, int end, int kIndex) {
        if (start == end) return arr[start];

        int pivot = findPivot(arr, start, end);

        int pivotPos = -1;
        for (int i = start; i <= end; i++) {
            if (arr[i] == pivot) {
                pivotPos = i;
                break;
            }
        }
        swap(arr, pivotPos, end);

        int pivotIndex = partition(arr, start, end);

        if (kIndex == pivotIndex) {
            return arr[pivotIndex];
        } else if (kIndex < pivotIndex) {
            return select(arr, start, pivotIndex - 1, kIndex);
        } else {
            return select(arr, pivotIndex + 1, end, kIndex);
        }
    }

    private int findPivot(int[] arr, int start, int end) {
        int length = end - start + 1;
        if (length <= 5) {
            return findMedian(Arrays.copyOfRange(arr, start, end + 1));
        }

        ArrayList<Integer> medians = new ArrayList<>();
        int i = start;
        for (; i + 4 <= end; i += 5) {
            int median = findMedian(Arrays.copyOfRange(arr, i, i + 5));
            medians.add(median);
        }
        if (i <= end) {
            int median = findMedian(Arrays.copyOfRange(arr, i, end + 1));
            medians.add(median);
        }

        int[] medianArr = toArray(medians);
        return findPivot(medianArr, 0, medianArr.length - 1);
    }

    private int[] toArray(ArrayList<Integer> list) {
        int[] arr = new int[list.size()];
        for (int i = 0; i < list.size(); i++) {
            arr[i] = list.get(i);
        }
        return arr;
    }

    private int findMedian(int[] arr) {
        Arrays.sort(arr);
        return arr[arr.length / 2];
    }

    private int partition(int[] arr, int start, int end) {
        int pivot = arr[end];
        int i = start - 1;
        for (int j = start; j < end; j++) {
            if (arr[j] <= pivot) {
                i++;
                swap(arr, i, j);
            }
        }
        swap(arr, i + 1, end);
        return i + 1;
    }

    private void swap(int[] arr, int i, int j) {
        int tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }
}
