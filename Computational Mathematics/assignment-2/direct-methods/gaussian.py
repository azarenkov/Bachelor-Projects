N = 3


def gaussianElimination(mat):
    for k in range(N):
        i_max = max(range(k, N), key=lambda i: abs(mat[i][k]))
        if mat[i_max][k] == 0:
            print("Singular Matrix.")
            print(
                "Inconsistent System."
                if mat[i_max][N]
                else "May have infinitely many solutions."
            )
            return
        mat[k], mat[i_max] = mat[i_max], mat[k]

        for i in range(k + 1, N):
            f = mat[i][k] / mat[k][k]
            mat[i][k + 1 :] = [mat[i][j] - f * mat[k][j] for j in range(k + 1, N + 1)]
            mat[i][k] = 0

    x = [0] * N
    for i in range(N - 1, -1, -1):
        x[i] = (mat[i][N] - sum(mat[i][j] * x[j] for j in range(i + 1, N))) / mat[i][i]

    print("\nSolution for the system:")
    for xi in x:
        print(f"{xi:.8f}")


mat = [[3.0, 2.0, -4.0, 3.0], [2.0, 3.0, 3.0, 15.0], [5.0, -3.0, 1.0, 14.0]]
gaussianElimination(mat)
