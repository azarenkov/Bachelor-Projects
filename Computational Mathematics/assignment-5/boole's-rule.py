import numpy as np


def booles_rule(func, a, b, n=4):
    if n % 4 != 0:
        raise ValueError(
            "Number of intervals (n) must be divisible by 4 for Boole's rule"
        )

    h = (b - a) / n

    result = 7 * (func(a) + func(b))

    for i in range(1, n):
        x_i = a + i * h

        if i % 4 == 0:
            result += 14 * func(x_i)
        elif i % 2 == 0:
            result += 12 * func(x_i)
        else:
            result += 32 * func(x_i)

    result *= 2 * h / 45

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
    """Test function: x^5"""
    return x**5


if __name__ == "__main__":
    print("=" * 60)
    print("BOOLE'S RULE - Numerical Integration")
    print("=" * 60)

    # Test 1: Integrate x^2 from 0 to 1
    print("\nTest 1: ∫[0,1] x^2 dx")
    print(f"Exact value: {1 / 3:.10f}")

    for n in [4, 12, 100, 1000]:
        result = booles_rule(f1, 0, 1, n)
        error = abs(result - 1 / 3)
        print(f"n = {n:4d}: {result:.10f}, Error = {error:.10e}")

    # Test 2: Integrate sin(x) from 0 to π
    print("\n" + "-" * 60)
    print("Test 2: ∫[0,π] sin(x) dx")
    exact = 2.0
    print(f"Exact value: {exact:.10f}")

    for n in [4, 12, 100, 1000]:
        result = booles_rule(f2, 0, np.pi, n)
        error = abs(result - exact)
        print(f"n = {n:4d}: {result:.10f}, Error = {error:.10e}")

    # Test 3: Integrate e^x from 0 to 1
    print("\n" + "-" * 60)
    print("Test 3: ∫[0,1] e^x dx")
    exact = np.e - 1
    print(f"Exact value: {exact:.10f}")

    for n in [4, 12, 100, 1000]:
        result = booles_rule(f3, 0, 1, n)
        error = abs(result - exact)
        print(f"n = {n:4d}: {result:.10f}, Error = {error:.10e}")

    # Test 4: Integrate 1/(1+x^2) from 0 to 1 (result is π/4)
    print("\n" + "-" * 60)
    print("Test 4: ∫[0,1] 1/(1+x^2) dx")
    exact = np.pi / 4
    print(f"Exact value: {exact:.10f}")

    for n in [4, 12, 100, 1000]:
        result = booles_rule(f4, 0, 1, n)
        error = abs(result - exact)
        print(f"n = {n:4d}: {result:.10f}, Error = {error:.10e}")

    # Test 5: Integrate x^5 from 0 to 2 (Boole's rule is exact for polynomials of degree ≤ 5)
    print("\n" + "-" * 60)
    print("Test 5: ∫[0,2] x^5 dx (Exact for polynomials of degree ≤ 5)")
    exact = 64 / 6
    print(f"Exact value: {exact:.10f}")

    for n in [4, 12, 100]:
        result = booles_rule(f5, 0, 2, n)
        error = abs(result - exact)
        print(f"n = {n:4d}: {result:.10f}, Error = {error:.10e}")

    print("\n" + "=" * 60)
