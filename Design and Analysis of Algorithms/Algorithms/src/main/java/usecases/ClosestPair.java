package usecases;

import interfaces.Find;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

public final class ClosestPair implements Find {
    private double distance(double[] p1, double[] p2) {
        return Math.sqrt((p1[0] - p2[0]) * (p1[0] - p2[0]) +
                (p1[1] - p2[1]) * (p1[1] - p2[1]));
    }

    private Comparator<double[]> compareX = new Comparator<double[]>() {
        public int compare(double[] p1, double[] p2) {
            return Double.compare(p1[0], p2[0]);
        }
    };

    private Comparator<double[]> compareY = new Comparator<double[]>() {
        public int compare(double[] p1, double[] p2) {
            return Double.compare(p1[1], p2[1]);
        }
    };

    private double stripClosest(double[][] strip, double d) {
        double minDist = d;

        Arrays.sort(strip, compareY);

        for (int i = 0; i < strip.length; i++) {
            for (int j = i + 1; j < strip.length && (strip[j][1] - strip[i][1]) < minDist; j++) {
                minDist = Math.min(minDist, distance(strip[i], strip[j]));
            }
        }

        return minDist;
    }

    private double minDistUtil(double[][] points, int left, int right) {

        if (right - left <= 2) {
            double minDist = Double.MAX_VALUE;
            for (int i = left; i < right; i++) {
                for (int j = i + 1; j < right; j++) {
                    minDist = Math.min(minDist, distance(points[i], points[j]));
                }
            }
            return minDist;
        }

        int mid = (left + right) / 2;
        double midX = points[mid][0];

        double dl = minDistUtil(points, left, mid);
        double dr = minDistUtil(points, mid, right);

        double d = Math.min(dl, dr);

        List<double[]> strip = new ArrayList<>();
        for (int i = left; i < right; i++) {
            if (Math.abs(points[i][0] - midX) < d) {
                strip.add(points[i]);
            }
        }

        double stripDist = stripClosest(strip.toArray(new double[strip.size()][]), d);

        return Math.min(d, stripDist);
    }

    @Override
    public double find(double[][] points) {
        int n = points.length;

        Arrays.sort(points, compareX);

        return minDistUtil(points, 0, n);
    }
}
