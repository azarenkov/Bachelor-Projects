import numpy as np


def SOR(A, b, x_0, k, omega):
    n = A.shape[0]
    x = x_0.copy()

    for l in range(k):
        for i in range(n):
            sum = 0.0
            for j in range(n):
                if i != j:
                    sum += A[i, j] * x[j]
            x[i] = (1 - omega) * x[i] + omega * (b[i] - sum) / A[i, i]
    return x


# Example usage
# Diagonally dominant system of equations:
# 10x + y + z = 12
# x + 10y + z = 12
# x + y + 10z = 12

A = np.array([[10, 1, 1], [1, 10, 1], [1, 1, 10]], dtype=float)

b = np.array([12, 12, 12], dtype=float)

x_0 = np.array([0, 0, 0], dtype=float)  # Initial guess

k = 10  # Number of iterations
omega = 1.25  # Relaxation parameter (over-relaxation)

print("Matrix A (diagonally dominant):")
print(A)
print("\nVector b:")
print(b)
print("\nInitial guess x_0:")
print(x_0)
print("\nNumber of iterations:", k)
print("Relaxation parameter omega:", omega)

x = SOR(A, b, x_0, k, omega)

print("\nSolution after", k, "iterations:")
print("x =", x[0])
print("y =", x[1])
print("z =", x[2])

# Verification
print("\nVerification (A*x):")
result = np.dot(A, x)
print(result)
print("Should equal b:")
print(b)
print("\nError:")
print(np.abs(result - b))
