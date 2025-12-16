package entities;

public class Edge {
    public int source;
    public int dest;
    public int weight;

    public Edge(int source, int dest, int weight) {
        this.source = source;
        this.dest = dest;
        this.weight = weight;
    }

    @Override
    public String toString() {
        return source + " - " + dest + ": " + weight;
    }
}
