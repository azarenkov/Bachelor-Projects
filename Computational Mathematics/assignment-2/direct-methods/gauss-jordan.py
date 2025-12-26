M = 10


def PrintMatrix(a, n):
    for i in range(n):
        print(*a[i])


def PerformOperation(a, n):
    i = 0
    j = 0
    k = 0
    c = 0
    flag = 0
    m = 0
    pro = 0

    for i in range(n):
        if a[i][i] == 0:
            c = 1
            while (i + c) < n and a[i + c][i] == 0:
                c += 1
            if (i + c) == n:
                flag = 1
                break

            j = i
            for k in range(1 + n):
                temp = a[j][k]
                a[j][k] = a[j + c][k]
                a[j + c][k] = temp

        for j in range(n):
            if i != j:
                p = a[j][i] / a[i][i]

                k = 0
                for k in range(n + 1):
                    a[j][k] = a[j][k] - (a[i][k]) * p

    return flag


def PrintResult(a, n, flag):
    print("Result is : ")

    if flag == 2:
        print("Infinite Solutions Exists<br>")
    elif flag == 3:
        print("No Solution Exists<br>")

    else:
        for i in range(n):
            print(a[i][n] / a[i][i], end=" ")


def CheckConsistency(a, n, flag):
    flag = 3
    for i in range(n):
        sum = 0
        for j in range(n):
            sum = sum + a[i][j]
        if sum == a[i][j]:
            flag = 2

    return flag


a = [[0, 2, 1, 4], [1, 1, 2, 6], [2, 1, 1, 7]]

n = 3
flag = 0

flag = PerformOperation(a, n)

if flag == 1:
    flag = CheckConsistency(a, n, flag)

print("Final Augmented Matrix is : ")
PrintMatrix(a, n)
print()

PrintResult(a, n, flag)
