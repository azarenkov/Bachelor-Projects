import numpy as np

A = np.array([[4, 1, 0], [1, 4, 1], [0, 1, 4]], dtype=float)

print("Исходная матрица A:")
print(A)
print()

n = A.shape[0]
I = np.eye(n)

max_iter = 1000
tol = 1e-10

norm_A_sq = np.linalg.norm(A, "fro") ** 2
X = A.T / norm_A_sq

print("Итерационный метод (ряд Неймана)")
print("Итерация: X_{k+1} = X_k * (2*I - A*X_k)")
print("=" * 60)

for iteration in range(max_iter):
    R = I - A @ X
    residual_norm = np.linalg.norm(R, "fro")

    if residual_norm < tol:
        print(f"Сходимость достигнута на итерации {iteration}")
        print(f"Норма невязки: {residual_norm:.2e}")
        break

    X = X + X @ R

    if iteration % 100 == 0:
        print(f"Итерация {iteration}: норма невязки = {residual_norm:.2e}")
else:
    print(f"Предупреждение: не сошлось за {max_iter} итераций")
    print(f"Финальная норма невязки: {residual_norm:.2e}")

print()
print("Обратная матрица A^(-1) (итерационный метод):")
print(X)
print()

print("Проверка: A * A^(-1) =")
print(A @ X)
print()

print("Сравнение с NumPy:")
print(np.linalg.inv(A))
print()

print("Разница с точным решением:")
print("||X - A^(-1)||_F =", np.linalg.norm(X - np.linalg.inv(A), "fro"))
