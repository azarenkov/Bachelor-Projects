def euler_method(f, x0, y0, h, n):
    x = x0
    y = y0

    for i in range(n):
        y = y + h * f(x, y)
        x = x + h

    return x, y


def euler_method_full(f, x0, y0, h, n):
    points = [(x0, y0)]
    x = x0
    y = y0

    for i in range(n):
        y = y + h * f(x, y)
        x = x + h
        points.append((x, y))

    return points


if __name__ == "__main__":

    def f(x, y):
        return x + y

    x0, y0 = 0, 1
    h = 0.1
    n = 10

    x_final, y_final = euler_method(f, x0, y0, h, n)
    print(f"Final point: x = {x_final}, y = {y_final}")

    points = euler_method_full(f, x0, y0, h, n)
    print("\nAll points:")
    for x, y in points:
        print(f"x = {x:.1f}, y = {y:.6f}")


# Входные данные:
# ├─ f: функция f(x,y) из уравнения y' = f(x,y)
# ├─ x0 = 0, y0 = 1 (начальная точка)
# ├─ h = 0.1 (шаг интегрирования)
# └─ n = 10 (количество шагов)

# Процесс:
# 1. Начать с (x₀, y₀)
# 2. На каждом шаге i:
#    - Вычислить наклон: k = f(xᵢ, yᵢ)
#    - Следующая точка: yᵢ₊₁ = yᵢ + h·k
#    - Следующая x: xᵢ₊₁ = xᵢ + h
# 3. Повторить n раз

# Результат:
# ├─ euler_method: конечная точка (x_final, y_final)
# └─ euler_method_full: все промежуточные точки [(x₀,y₀), (x₁,y₁), ..., (xₙ,yₙ)]

# Формула Эйлера:
# yᵢ₊₁ = yᵢ + h·f(xᵢ, yᵢ)

# Пример для y' = x + y, y(0) = 1, h = 0.1:
# Шаг 0: (x₀, y₀) = (0.0, 1.0)
# Шаг 1: y₁ = 1.0 + 0.1·f(0.0, 1.0) = 1.0 + 0.1·(0.0 + 1.0) = 1.1
#        (x₁, y₁) = (0.1, 1.1)
# Шаг 2: y₂ = 1.1 + 0.1·f(0.1, 1.1) = 1.1 + 0.1·(0.1 + 1.1) = 1.22
#        (x₂, y₂) = (0.2, 1.22)
# Шаг 3: y₃ = 1.22 + 0.1·f(0.2, 1.22) = 1.22 + 0.1·(0.2 + 1.22) = 1.362
#        (x₃, y₃) = (0.3, 1.362)
# ...и так далее до x₁₀ = 1.0
