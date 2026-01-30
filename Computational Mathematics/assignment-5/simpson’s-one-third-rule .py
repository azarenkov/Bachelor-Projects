import numpy as np


def simpsons_one_third(func, a, b, n=2):
    if n % 2 != 0:
        raise ValueError("Number of intervals (n) must be even for Simpson's 1/3 rule")

    h = (b - a) / n

    result = func(a) + func(b)

    for i in range(1, n, 2):
        x_i = a + i * h
        result += 4 * func(x_i)

    for i in range(2, n, 2):
        x_i = a + i * h
        result += 2 * func(x_i)

    result *= h / 3

    return result


def f1(x):
    """Test function: x^2"""
    return x**2


def f2(x):
    """Test function: sin(x)"""
    return np.sin(x)


def f3(x):
    """Test function: e^x"""
    return np.exp(x)


def f4(x):
    """Test function: 1/(1+x^2)"""
    return 1 / (1 + x**2)


def f5(x):
    """Test function: x^3"""
    return x**3


if __name__ == "__main__":
    print("=" * 60)
    print("SIMPSON'S ONE-THIRD RULE - Numerical Integration")
    print("=" * 60)

    print("\nTest 1: ∫[0,1] x^2 dx")
    print(f"Exact value: {1 / 3:.10f}")

    for n in [2, 10, 100, 1000]:
        result = simpsons_one_third(f1, 0, 1, n)
        error = abs(result - 1 / 3)
        print(f"n = {n:4d}: {result:.10f}, Error = {error:.10e}")

    print("\n" + "-" * 60)
    print("Test 2: ∫[0,π] sin(x) dx")
    exact = 2.0
    print(f"Exact value: {exact:.10f}")

    for n in [2, 10, 100, 1000]:
        result = simpsons_one_third(f2, 0, np.pi, n)
        error = abs(result - exact)
        print(f"n = {n:4d}: {result:.10f}, Error = {error:.10e}")

    print("\n" + "-" * 60)
    print("Test 3: ∫[0,1] e^x dx")
    exact = np.e - 1
    print(f"Exact value: {exact:.10f}")

    for n in [2, 10, 100, 1000]:
        result = simpsons_one_third(f3, 0, 1, n)
        error = abs(result - exact)
        print(f"n = {n:4d}: {result:.10f}, Error = {error:.10e}")

    print("\n" + "-" * 60)
    print("Test 4: ∫[0,1] 1/(1+x^2) dx")
    exact = np.pi / 4
    print(f"Exact value: {exact:.10f}")

    for n in [2, 10, 100, 1000]:
        result = simpsons_one_third(f4, 0, 1, n)
        error = abs(result - exact)
        print(f"n = {n:4d}: {result:.10f}, Error = {error:.10e}")

    print("\n" + "-" * 60)
    print("Test 5: ∫[0,2] x^3 dx (Exact for polynomials of degree ≤ 3)")
    exact = 4.0
    print(f"Exact value: {exact:.10f}")

    for n in [2, 10, 100]:
        result = simpsons_one_third(f5, 0, 2, n)
        error = abs(result - exact)
        print(f"n = {n:4d}: {result:.10f}, Error = {error:.10e}")

    print("\n" + "=" * 60)
