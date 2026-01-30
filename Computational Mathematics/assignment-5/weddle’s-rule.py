import numpy as np


def weddles_rule(func, a, b, n=6):
    if n % 6 != 0:
        raise ValueError(
            "Number of intervals (n) must be divisible by 6 for Weddle's rule"
        )

    h = (b - a) / n

    result = func(a) + func(b)

    for i in range(1, n):
        x_i = a + i * h
        position = i % 6

        if position == 0:
            result += 2 * func(x_i)
        elif position == 1 or position == 5:
            result += 5 * func(x_i)
        elif position == 3:
            result += 6 * func(x_i)
        else:
            result += func(x_i)

    result *= 3 * h / 10

    return result


# Test functions
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
    """Test function: x^6"""
    return x**6


if __name__ == "__main__":
    print("=" * 60)
    print("WEDDLE'S RULE - Numerical Integration")
    print("=" * 60)

    # Test 1: Integrate x^2 from 0 to 1
    print("\nTest 1: ∫[0,1] x^2 dx")
    print(f"Exact value: {1 / 3:.10f}")

    for n in [6, 12, 96, 996]:
        result = weddles_rule(f1, 0, 1, n)
        error = abs(result - 1 / 3)
        print(f"n = {n:4d}: {result:.10f}, Error = {error:.10e}")

    # Test 2: Integrate sin(x) from 0 to π
    print("\n" + "-" * 60)
    print("Test 2: ∫[0,π] sin(x) dx")
    exact = 2.0
    print(f"Exact value: {exact:.10f}")

    for n in [6, 12, 96, 996]:
        result = weddles_rule(f2, 0, np.pi, n)
        error = abs(result - exact)
        print(f"n = {n:4d}: {result:.10f}, Error = {error:.10e}")

    # Test 3: Integrate e^x from 0 to 1
    print("\n" + "-" * 60)
    print("Test 3: ∫[0,1] e^x dx")
    exact = np.e - 1
    print(f"Exact value: {exact:.10f}")

    for n in [6, 12, 96, 996]:
        result = weddles_rule(f3, 0, 1, n)
        error = abs(result - exact)
        print(f"n = {n:4d}: {result:.10f}, Error = {error:.10e}")

    # Test 4: Integrate 1/(1+x^2) from 0 to 1 (result is π/4)
    print("\n" + "-" * 60)
    print("Test 4: ∫[0,1] 1/(1+x^2) dx")
    exact = np.pi / 4
    print(f"Exact value: {exact:.10f}")

    for n in [6, 12, 96, 996]:
        result = weddles_rule(f4, 0, 1, n)
        error = abs(result - exact)
        print(f"n = {n:4d}: {result:.10f}, Error = {error:.10e}")

    # Test 5: Integrate x^6 from 0 to 2
    print("\n" + "-" * 60)
    print("Test 5: ∫[0,2] x^6 dx")
    exact = 128 / 7
    print(f"Exact value: {exact:.10f}")

    for n in [6, 12, 96]:
        result = weddles_rule(f5, 0, 2, n)
        error = abs(result - exact)
        print(f"n = {n:4d}: {result:.10f}, Error = {error:.10e}")

    print("\n" + "=" * 60)
