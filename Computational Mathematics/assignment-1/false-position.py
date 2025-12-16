MAX_ITER = 1000000

# The function is x^3 - x^2 + 2
def func(x):
    return x * x * x - x * x + 2


# Prints root of func(x) in interval [a, b]
def false_position(a, b):
    if func(a) * func(b) >= 0:
        print("You have not assumed right a and b")
        return -1

    c = a

    for i in range(MAX_ITER):

        # Find the point that touches x axis
        c = (a * func(b) - b * func(a)) / (func(b) - func(a))

        # Check if the above found point is root
        if func(c) == 0:
            break

        # Decide the side to repeat the steps
        elif func(c) * func(a) < 0:
            b = c
        else:
            a = c
    print("The value of root is : ", '%.4f' % c)
    return None


a = -100
b = 300
false_position(a, b)
