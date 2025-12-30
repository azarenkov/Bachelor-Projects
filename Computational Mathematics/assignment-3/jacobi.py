import numpy as np

A = np.array([[4, 1, 0], [1, 4, 1], [0, 1, 4]], dtype=float)

print("Исходная симметричная матрица A:")
print(A)
print()

if not np.allclose(A, A.T):
    print("ОШИБКА: Метод Якоби требует симметричную матрицу!")
    exit(1)

n = A.shape[0]
max_iter = 10000
tol = 1e-10

A_current = A.copy()
V = np.eye(n)

for iteration in range(max_iter):
    max_val = 0
    p, q = 0, 1

    for i in range(n):
        for j in range(i + 1, n):
            if abs(A_current[i, j]) > max_val:
                max_val = abs(A_current[i, j])
                p, q = i, j

    if max_val < tol:
        print(f"Сходимость на итерации {iteration}")
        break

    if abs(A_current[p, p] - A_current[q, q]) < 1e-15:
        t = 1.0
    else:
        tau = (A_current[q, q] - A_current[p, p]) / (2 * A_current[p, q])
        t = np.sign(tau) / (abs(tau) + np.sqrt(1 + tau**2))

    c = 1 / np.sqrt(1 + t**2)
    s = t * c

    app = A_current[p, p]
    aqq = A_current[q, q]
    apq = A_current[p, q]

    A_current[p, p] = c * c * app - 2 * s * c * apq + s * s * aqq
    A_current[q, q] = s * s * app + 2 * s * c * apq + c * c * aqq
    A_current[p, q] = 0
    A_current[q, p] = 0

    for i in range(n):
        if i != p and i != q:
            aip = A_current[i, p]
            aiq = A_current[i, q]
            A_current[i, p] = c * aip - s * aiq
            A_current[p, i] = A_current[i, p]
            A_current[i, q] = s * aip + c * aiq
            A_current[q, i] = A_current[i, q]

    for i in range(n):
        vip = V[i, p]
        viq = V[i, q]
        V[i, p] = c * vip - s * viq
        V[i, q] = s * vip + c * viq

print()

eigenvalues = np.diag(A_current)
idx = eigenvalues.argsort()[::-1]
eigenvalues = eigenvalues[idx]
eigenvectors = V[:, idx]

print("Собственные значения:")
print(eigenvalues)
print()

print("Собственные векторы:")
print(eigenvectors)
print()

for i in range(n):
    v = eigenvectors[:, i]
    lam = eigenvalues[i]
    print(f"λ_{i + 1} = {lam:.10f}")
    print(f"v_{i + 1} = {v}")
    print(f"||A*v - λ*v|| = {np.linalg.norm(A @ v - lam * v):.2e}")
    print()

print("NumPy:")
eig_vals = np.linalg.eig(A)[0]
print(np.sort(eig_vals)[::-1])
