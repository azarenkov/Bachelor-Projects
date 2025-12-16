import numpy as np


# f function
def f_function(x):
    y = x ** 2 + 3 * x + 2
    return y


# g function
def g_function(x):
    y = (1 / 3) * (-(x ** 2) - 2)
    return y


# g function
def g_function2(x):
    y = -np.sqrt(-3 * x - 2)
    return y


# function implementing the fixed point iteration
def fixed_point_iteration(gF, initial_guess, tolerance_error=10 ** (-6), max_iteration=1000):
    k = 0
    x_k = initial_guess
    error = 1000

    x_kp1 = x_k

    print("Iteration no: ", k, "** x= ", x_k)
    while k < max_iteration and error > tolerance_error:
        x_kp1 = gF(x_k)
        error = np.abs(x_kp1 - x_k)
        x_k = x_kp1
        k = k + 1
        print("Iteration no: ", k, "** x= ", x_k)

    return x_kp1


# initial guess
x0 = -1.5

# max number of iteration
maxIterationNumber = 500

# tolerance error
tE = 10 ** (-5)

# First g function
solution = fixed_point_iteration(g_function, x0, tE, maxIterationNumber)

# value of the function f
f_function(solution)

# Second g function
# initial guess
x0 = -1.2

solution2 = fixed_point_iteration(g_function2, x0, tE, maxIterationNumber)

# value of the function f
f_function(solution2)
