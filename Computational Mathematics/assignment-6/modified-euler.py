def modified_euler_method(f, x0, y0, h, n):
    x = x0
    y = y0

    for i in range(n):
        y_predictor = y + h * f(x, y)
        y = y + h * (f(x, y) + f(x + h, y_predictor)) / 2
        x = x + h

    return x, y


def modified_euler_method_full(f, x0, y0, h, n):
    points = [(x0, y0)]
    x = x0
    y = y0

    for i in range(n):
        y_predictor = y + h * f(x, y)
        y = y + h * (f(x, y) + f(x + h, y_predictor)) / 2
        x = x + h
        points.append((x, y))

    return points


if __name__ == "__main__":

    def f(x, y):
        return x + y

    x0, y0 = 0, 1
    h = 0.1
    n = 10

    x_final, y_final = modified_euler_method(f, x0, y0, h, n)
    print(f"Final point: x = {x_final}, y = {y_final}")

    points = modified_euler_method_full(f, x0, y0, h, n)
    print("\nAll points:")
    for x, y in points:
        print(f"x = {x:.1f}, y = {y:.6f}")

# Входные данные:
# ├─ f: функция f(x,y) из уравнения y' = f(x,y)
# ├─ x0 = 0, y0 = 1 (начальная точка)
# ├─ h = 0.1 (шаг интегрирования)
# └─ n = 10 (количество шагов)

# Процесс (Predictor-Corrector):
# 1. Начать с (x₀, y₀)
# 2. На каждом шаге i:
#    Predictor (предсказание):
#    - y* = yᵢ + h·f(xᵢ, yᵢ)
#    Corrector (коррекция):
#    - k₁ = f(xᵢ, yᵢ) - наклон в начале
#    - k₂ = f(xᵢ₊₁, y*) - наклон в конце
#    - yᵢ₊₁ = yᵢ + h·(k₁ + k₂)/2 - среднее
#    - xᵢ₊₁ = xᵢ + h
# 3. Повторить n раз

# Результат:
# ├─ modified_euler_method: конечная точка (x_final, y_final)
# └─ modified_euler_method_full: все промежуточные точки

# Формулы:
# Predictor: y* = yᵢ + h·f(xᵢ, yᵢ)
# Corrector: yᵢ₊₁ = yᵢ + h·[f(xᵢ, yᵢ) + f(xᵢ₊₁, y*)]/2

# Пример для y' = x + y, y(0) = 1, h = 0.1:
# Шаг 0: (x₀, y₀) = (0.0, 1.0)
# Шаг 1:
#   Predictor: y* = 1.0 + 0.1·(0.0 + 1.0) = 1.1
#   Corrector: k₁ = 0.0 + 1.0 = 1.0
#              k₂ = 0.1 + 1.1 = 1.2
#              y₁ = 1.0 + 0.1·(1.0 + 1.2)/2 = 1.0 + 0.11 = 1.11
#   (x₁, y₁) = (0.1, 1.11)
# Шаг 2:
#   Predictor: y* = 1.11 + 0.1·(0.1 + 1.11) = 1.231
#   Corrector: k₁ = 0.1 + 1.11 = 1.21
#              k₂ = 0.2 + 1.231 = 1.431
#              y₂ = 1.11 + 0.1·(1.21 + 1.431)/2 = 1.11 + 0.1321 = 1.2421
#   (x₂, y₂) = (0.2, 1.2421)
# ...и так далее до x₁₀ = 1.0

# Геометрическая интерпретация:
# 1. Predictor делает шаг по методу Эйлера (предварительная оценка)
# 2. Corrector вычисляет средний наклон между началом и концом шага
# 3. Используется среднее арифметическое двух наклонов
# Это дает точность второго порядка O(h²) вместо O(h) у обычного Эйлера

# Преимущество:
# Точнее обычного метода Эйлера при том же шаге h
