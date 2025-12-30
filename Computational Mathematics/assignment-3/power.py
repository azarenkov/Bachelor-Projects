import numpy as np

A = np.array([[4, 1, 0], [1, 4, 1], [0, 1, 4]], dtype=float)

print("Исходная матрица A:")
print(A)
print()

tol = 1e-10
max_iter = 1000


print("=" * 60)
print("СТЕПЕННОЙ МЕТОД (наибольшее собственное значение)")
print("=" * 60)

x = np.random.rand(A.shape[0], 1)
x = x / np.linalg.norm(x)

lam_prev = 0

for i in range(max_iter):
    y = A @ x
    x = y / np.linalg.norm(y)

    lam = (x.T @ A @ x) / (x.T @ x)
    lam = lam[0, 0]

    if np.abs(lam - lam_prev) < tol:
        print(f"Сходимость на итерации {i + 1}")
        break

    lam_prev = lam

    if (i + 1) % 100 == 0:
        print(f"Итерация {i + 1}: λ ≈ {lam:.10f}")

print()
print(f"Наибольшее собственное значение: λ_max = {lam:.10f}")
print(f"Собственный вектор:")
print(x.flatten())
print()
print("Проверка A*v:")
print((A @ x).flatten())
print("λ*v:")
print((lam * x).flatten())
print(f"Ошибка ||A*v - λ*v|| = {np.linalg.norm(A @ x - lam * x):.2e}")
print()


print("=" * 60)
print("ОБРАТНЫЙ СТЕПЕННОЙ МЕТОД (наименьшее собственное значение)")
print("=" * 60)

x = np.random.rand(A.shape[0], 1)
x = x / np.linalg.norm(x)

lam_prev = 0

for i in range(max_iter):
    y = np.linalg.solve(A, x)
    x = y / np.linalg.norm(y)

    lam = (x.T @ A @ x) / (x.T @ x)
    lam = lam[0, 0]

    if i > 0 and np.abs(lam - lam_prev) < tol:
        print(f"Сходимость на итерации {i + 1}")
        break

    lam_prev = lam

    if (i + 1) % 100 == 0:
        print(f"Итерация {i + 1}: λ ≈ {lam:.10f}")

print()
print(f"Наименьшее собственное значение: λ_min = {lam:.10f}")
print(f"Собственный вектор:")
print(x.flatten())
print()
print("Проверка A*v:")
print((A @ x).flatten())
print("λ*v:")
print((lam * x).flatten())
print(f"Ошибка ||A*v - λ*v|| = {np.linalg.norm(A @ x - lam * x):.2e}")
print()


print("=" * 60)
print("СРАВНЕНИЕ С NUMPY")
print("=" * 60)
eigenvalues, eigenvectors = np.linalg.eig(A)
idx = np.argsort(eigenvalues)[::-1]
eigenvalues = eigenvalues[idx]

print("Все собственные значения:")
print(eigenvalues)
