import numpy as np


def taylors_method(derivatives, x0, y0, x_star, N):
    derivatives_at_x0 = [y0]

    for i in range(N):
        derivatives_at_x0.append(derivatives[i](x0, y0))

    result = derivatives_at_x0[0]
    factorial = 1

    for n in range(1, len(derivatives_at_x0)):
        factorial *= n
        result += ((x_star - x0) ** n / factorial) * derivatives_at_x0[n]

    return result


if __name__ == "__main__":

    def y_prime(x, y):
        return x + y

    def y_double_prime(x, y):
        return 1 + (x + y)

    def y_triple_prime(x, y):
        return 1 + (x + y)

    def y_quad_prime(x, y):
        return 1 + (x + y)

    x0 = 0
    y0 = 1
    x_star = 1.0
    N = 4

    derivatives = [y_prime, y_double_prime, y_triple_prime, y_quad_prime]

    result = taylors_method(derivatives, x0, y0, x_star, N)

    print(f"y({x_star}) = {result}")

    exact = 2 * np.exp(x_star) - x_star - 1
    print(f"Exact: {exact}")
    print(f"Error: {abs(result - exact)}")


# Входные данные:
# ├─ derivatives: список функций [y', y'', y''', y⁴]
# ├─ x0 = 0, y0 = 1 (начальная точка)
# ├─ x_star = 1.0 (точка, где нужно найти y)
# └─ N = 4 (количество членов ряда)

# Процесс:
# 1. Вычислить все производные в (x₀, y₀) → [1, 1, 2, 2, 2]
# 2. Применить формулу Тейлора с факториалами
# 3. Суммировать N+1 членов ряда

# Результат: y(1) ≈ 3.417
