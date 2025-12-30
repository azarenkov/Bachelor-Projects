import numpy as np

A = np.array([[4, 3, 0], [3, 4, -1], [0, -1, 4]], dtype=float)

print("Исходная матрица A:")
print(A)
print()

n = A.shape[0]

L = np.eye(n)
U = A.copy()

for k in range(n - 1):
    for i in range(k + 1, n):
        L[i, k] = U[i, k] / U[k, k]
        U[i, k:] = U[i, k:] - L[i, k] * U[k, k:]

print("Нижняя треугольная матрица L:")
print(L)
print()

print("Верхняя треугольная матрица U:")
print(U)
print()

print("Проверка: L * U =")
print(L @ U)
print()

A_inv = np.zeros((n, n))

for j in range(n):
    e = np.zeros(n)
    e[j] = 1.0

    y = np.zeros(n)
    for i in range(n):
        y[i] = (e[i] - np.dot(L[i, :i], y[:i])) / L[i, i]

    x = np.zeros(n)
    for i in range(n - 1, -1, -1):
        x[i] = (y[i] - np.dot(U[i, i + 1 :], x[i + 1 :])) / U[i, i]

    A_inv[:, j] = x

print("Обратная матрица A^(-1):")
print(A_inv)
print()

print("Проверка: A * A^(-1) =")
print(A @ A_inv)
print()

print("Сравнение с NumPy:")
print(np.linalg.inv(A))
