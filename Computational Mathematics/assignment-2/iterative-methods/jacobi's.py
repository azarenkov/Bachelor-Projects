import numpy as np


def jacobi(A, b, x_0, k):
    n = A.shape[0]
    x = x_0.copy()
    x_new = x_0.copy()

    for iteration in range(k):
        for i in range(n):
            sum_val = 0.0
            for j in range(n):
                if i != j:
                    sum_val += A[i, j] * x[j]

            x_new[i] = (b[i] - sum_val) / A[i, i]

        x = x_new.copy()

    return x


A = np.array([[2.0, 1.0], [5.0, 7.0]], dtype=float)

b = np.array([11.0, 13.0], dtype=float)

x_0 = np.array([1.0, 1.0], dtype=float)

k = 25

print("Matrix A:")
print(A)
print("\nVector b:")
print(b)
print("\nInitial guess x_0:")
print(x_0)
print("\nNumber of iterations:", k)

x = jacobi(A, b, x_0, k)

print("\nSolution after", k, "iterations:")
for i in range(len(x)):
    print(f"x[{i}] = {x[i]}")

# Verification
print("\nVerification (A*x):")
result = np.dot(A, x)
print(result)
print("Should equal b:")
print(b)
print("\nError:")
print(np.abs(result - b))
