// Syntax Sniper drill banks.
//
// Each `_` in `code` is a single-character blank; `answers[i]` is the
// expected char for the i-th underscore (left-to-right reading order).
//
// `practiceBank` and `testBank` are deliberately distinct sets so students
// who drill in Practice don't memorise the Pre-/Post-Test items. Both banks
// span easy/medium/hard so the game can pull a varied session from either.

export const practiceBank = [
    {
        id: "P-01",
        title: "Print a greeting",
        difficulty: "easy",
        code: `int main()
{
    printf("Hello, World!")_
    return 0_
}`,
        answers: [";", ";"],
    },
    {
        id: "P-02",
        title: "Two variables",
        difficulty: "easy",
        code: `int main()
{
    int a = 4_
    int b = 6_
    printf("%d"_ a + b)_
    return 0_
}`,
        answers: [";", ";", ",", ";", ";"],
    },
    {
        id: "P-03",
        title: "Read an int",
        difficulty: "easy",
        code: `int main()
{
    int n_
    scanf("%d"_ &n)_
    printf("%d"_ n)_
    return 0_
}`,
        answers: [";", ",", ";", ",", ";", ";"],
    },
    {
        id: "P-04",
        title: "Even or odd",
        difficulty: "easy",
        code: `int main()
{
    int x = 8_
    if (x % 2 == 0)
    {
        printf("even")_
    }
    else
    {
        printf("odd")_
    }
    return 0_
}`,
        answers: [";", ";", ";", ";"],
    },
    {
        id: "P-05",
        title: "Sum 1 to 5",
        difficulty: "medium",
        code: `int main()
{
    int sum = 0_
    for (int i = 1_ i <= 5_ i++)
    {
        sum += i_
    }
    printf("%d"_ sum)_
    return 0_
}`,
        answers: [";", ";", ";", ";", ",", ";", ";"],
    },
    {
        id: "P-06",
        title: "Char compare",
        difficulty: "medium",
        code: `int main()
{
    char c = 'A'_
    if (c == 'A')
    {
        printf("got A")_
    }
    return 0_
}`,
        answers: [";", ";", ";"],
    },
    {
        id: "P-07",
        title: "Function call",
        difficulty: "medium",
        code: `int square(int n)
{
    return n * n_
}

int main()
{
    int r = square(5)_
    printf("%d"_ r)_
    return 0_
}`,
        answers: [";", ";", ",", ";", ";"],
    },
    {
        id: "P-08",
        title: "Array fill",
        difficulty: "medium",
        code: `int main()
{
    int arr[3] = {1_ 2_ 3}_
    for (int i = 0_ i < 3_ i++)
    {
        printf("%d "_ arr[i])_
    }
    return 0_
}`,
        answers: [",", ",", ";", ";", ";", ",", ";", ";"],
    },
    {
        id: "P-09",
        title: "Countdown",
        difficulty: "medium",
        code: `int main()
{
    int n = 3_
    while (n > 0)
    {
        printf("%d "_ n)_
        n--_
    }
    return 0_
}`,
        answers: [";", ",", ";", ";", ";"],
    },
    {
        id: "P-10",
        title: "String length",
        difficulty: "hard",
        code: `#include <string.h>
int main()
{
    char s[] = "syntax"_
    int len = strlen(s)_
    printf("%d"_ len)_
    return 0_
}`,
        answers: [";", ";", ",", ";", ";"],
    },
    {
        id: "P-11",
        title: "Max of two",
        difficulty: "hard",
        code: `int max(int a_ int b)
{
    return (a > b) ? a : b_
}

int main()
{
    int m = max(7_ 12)_
    printf("%d"_ m)_
    return 0_
}`,
        answers: [",", ";", ",", ";", ",", ";", ";"],
    },
    {
        id: "P-12",
        title: "Pointer basics",
        difficulty: "hard",
        code: `int main()
{
    int v = 42_
    int *p = &v_
    printf("%d"_ *p)_
    return 0_
}`,
        answers: [";", ";", ",", ";", ";"],
    },
];

export const testBank = [
    {
        id: "T-01",
        title: "Multi-var declare",
        difficulty: "easy",
        code: `int main()
{
    int x = 5_ y = 10_ z = 15_
    printf("%d %d %d"_ x_ y_ z)_
    return 0_
}`,
        answers: [",", ",", ";", ",", ",", ",", ";", ";"],
    },
    {
        id: "T-02",
        title: "Format three values",
        difficulty: "easy",
        code: `int main()
{
    int a = 1_
    int b = 2_
    int c = a + b_
    printf("a=%d b=%d c=%d"_ a_ b_ c)_
    return 0_
}`,
        answers: [";", ";", ";", ",", ",", ",", ";", ";"],
    },
    {
        id: "T-03",
        title: "Grade ladder",
        difficulty: "medium",
        code: `int main()
{
    int score = 73_
    if (score >= 90)
    {
        printf("A")_
    }
    else if (score >= 75)
    {
        printf("B")_
    }
    else
    {
        printf("C")_
    }
    return 0_
}`,
        answers: [";", ";", ";", ";", ";"],
    },
    {
        id: "T-04",
        title: "Factorial",
        difficulty: "medium",
        code: `int main()
{
    int n = 5_ f = 1_
    for (int i = 1_ i <= n_ i++)
    {
        f *= i_
    }
    printf("%d"_ f)_
    return 0_
}`,
        answers: [",", ";", ";", ";", ";", ",", ";", ";"],
    },
    {
        id: "T-05",
        title: "Switch on day",
        difficulty: "medium",
        code: `int main()
{
    int d = 3_
    switch (d)
    {
        case 1: printf("Mon")_ break_
        case 2: printf("Tue")_ break_
        case 3: printf("Wed")_ break_
        default: printf("?")_
    }
    return 0_
}`,
        answers: [";", ";", ";", ";", ";", ";", ";", ";", ";"],
    },
    {
        id: "T-06",
        title: "Two-arg function",
        difficulty: "medium",
        code: `int add(int a_ int b)
{
    return a + b_
}

int main()
{
    int s = add(3_ 4)_
    printf("%d"_ s)_
    return 0_
}`,
        answers: [",", ";", ",", ";", ",", ";", ";"],
    },
    {
        id: "T-07",
        title: "Array sum",
        difficulty: "hard",
        code: `int main()
{
    int arr[5] = {2_ 4_ 6_ 8_ 10}_
    int sum = 0_
    for (int i = 0_ i < 5_ i++)
    {
        sum += arr[i]_
    }
    printf("Sum: %d"_ sum)_
    return 0_
}`,
        answers: [",", ",", ",", ",", ";", ";", ";", ";", ";", ",", ";", ";"],
    },
    {
        id: "T-08",
        title: "Nested if",
        difficulty: "hard",
        code: `int main()
{
    int n = 7_
    if (n > 0)
    {
        if (n % 2 == 0)
        {
            printf("positive even")_
        }
        else
        {
            printf("positive odd")_
        }
    }
    return 0_
}`,
        answers: [";", ";", ";", ";"],
    },
    {
        id: "T-09",
        title: "Matrix init",
        difficulty: "hard",
        code: `int main()
{
    int m[2][2] = { {1_ 2}_ {3_ 4} }_
    printf("%d"_ m[0][0])_
    return 0_
}`,
        answers: [",", ",", ",", ";", ",", ";", ";"],
    },
    {
        id: "T-10",
        title: "Pointer arithmetic",
        difficulty: "hard",
        code: `int main()
{
    int a[3] = {10_ 20_ 30}_
    int *p = a_
    printf("%d"_ *(p + 1))_
    return 0_
}`,
        answers: [",", ",", ";", ";", ",", ";", ";"],
    },
    {
        id: "T-11",
        title: "Do-while",
        difficulty: "hard",
        code: `int main()
{
    int i = 0_
    do
    {
        printf("%d "_ i)_
        i++_
    } while (i < 3)_
    return 0_
}`,
        answers: [";", ",", ";", ";", ";", ";"],
    },
    {
        id: "T-12",
        title: "Struct field",
        difficulty: "hard",
        code: `struct Point { int x_ int y_ }_

int main()
{
    struct Point p = {3_ 4}_
    printf("%d %d"_ p.x_ p.y)_
    return 0_
}`,
        answers: [";", ";", ";", ",", ";", ",", ",", ";", ";"],
    },
];

// Default export retained for legacy callers — combined view of both banks.
const allDrills = [...practiceBank, ...testBank];
export default allDrills;
