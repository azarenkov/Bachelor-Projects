import numpy as np
from scipy import integrate


def picards_method(f, x0, y0, x_star, N):
    def phi_n(x):
        return y0

    for n in range(1, N + 1):
        phi_prev = phi_n

        def phi_n(x, phi_prev=phi_prev):
            if np.isscalar(x):

                def integrand(t):
                    return f(t, phi_prev(t))

                result, _ = integrate.quad(integrand, x0, x)
                return y0 + result
            else:
                return np.array([phi_n(xi) for xi in x])

    value_at_x_star = phi_n(x_star)

    return phi_n, value_at_x_star


if __name__ == "__main__":

    def f(x, y):
        return x + y

    x0 = 0
    y0 = 1
    x_star = 1.0
    N = 3

    phi_N, value = picards_method(f, x0, y0, x_star, N)

    print(f"phi_{N}({x_star}) = {value}")

    exact = 2 * np.exp(x_star) - x_star - 1
    print(f"Exact: {exact}")
    print(f"Error: {abs(value - exact)}")

# Входные данные:
# ├─ f: функция f(x,y) из уравнения y' = f(x,y)
# ├─ x0 = 0, y0 = 1 (начальная точка)
# ├─ x_star = 1.0 (точка, где нужно найти y)
# └─ N = 3 (количество итераций)

# Процесс:
# 1. Начать с φ₀(x) = y₀
# 2. Итерация n: φₙ(x) = y₀ + ∫[x₀ to x] f(t, φₙ₋₁(t)) dt
# 3. Повторить N раз
# 4. Вычислить φₙ(x_star)

# Результат:
# ├─ phi_N: функция φₙ(x) (можно вычислить для любого x)
# └─ value: конкретное значение φₙ(x_star)


# 0: φ₀(x) = y₀ (константа)
# 1: φ₁(x) = y₀ + ∫[x₀ to x] f(t, φ₀(t)) dt
# 2: φ₂(x) = y₀ + ∫[x₀ to x] f(t, φ₁(t)) dt
# 3: φ₃(x) = y₀ + ∫[x₀ to x] f(t, φ₂(t)) dt

# N=0: φ₀(x) = 1
# N=1: φ₁(x) = 1 + ∫[0 to x] (t + 1) dt
#            = 1 + [t²/2 + t] от 0 до x
#            = 1 + x²/2 + x
# N=2: φ₂(x) = 1 + ∫[0 to x] (t + φ₁(t)) dt
#            = 1 + ∫[0 to x] (t + 1 + t²/2 + t) dt
#            = 1 + ∫[0 to x] (1 + 2t + t²/2) dt
#            = 1 + x + x² + x³/6
# N=3: φ₃(x) = 1 + ∫[0 to x] (t + φ₂(t)) dt
#            = 1 + x + x² + x³/3 + x⁴/12
