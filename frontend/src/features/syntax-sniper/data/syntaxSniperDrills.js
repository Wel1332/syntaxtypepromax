// Single-character punctuation drills. Each `_` in `code` is a blank that the
// student fills with a single key. `answers[i]` is the expected char for the
// i-th underscore in left-to-right reading order.

const syntaxSniperDrills = [
    {
        id: 1,
        title: "Hello, World",
        difficulty: "easy",
        code: `int main()
{
    printf("Hello, World!")_
    return 0_
}`,
        answers: [";", ";"],
    },
    {
        id: 2,
        title: "Variable declaration",
        difficulty: "easy",
        code: `int main()
{
    int x = 5_
    int y = 10_
    int z = x + y_
    printf("%d"_ z)_
    return 0_
}`,
        answers: [";", ";", ";", ",", ";", ";"],
    },
    {
        id: 3,
        title: "If statement",
        difficulty: "easy",
        code: `int main()
{
    int score = 85_
    if (score >= 60)
    {
        printf("Pass")_
    }
    else
    {
        printf("Fail")_
    }
    return 0_
}`,
        answers: [";", ";", ";", ";"],
    },
    {
        id: 4,
        title: "For loop",
        difficulty: "medium",
        code: `int main()
{
    for (int i = 0_ i < 5_ i++)
    {
        printf("%d "_ i)_
    }
    return 0_
}`,
        answers: [";", ";", ",", ";", ";"],
    },
    {
        id: 5,
        title: "While loop",
        difficulty: "medium",
        code: `int main()
{
    int n = 10_
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
        id: 6,
        title: "Function definition",
        difficulty: "medium",
        code: `int add(int a_ int b)
{
    return a + b_
}

int main()
{
    int result = add(3_ 4)_
    printf("%d"_ result)_
    return 0_
}`,
        answers: [",", ";", ",", ";", ",", ";", ";"],
    },
    {
        id: 7,
        title: "Array iteration",
        difficulty: "hard",
        code: `int main()
{
    int arr[5] = {1_ 2_ 3_ 4_ 5}_
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
        id: 8,
        title: "Nested conditional",
        difficulty: "hard",
        code: `int main()
{
    int x = 7_
    if (x > 0)
    {
        if (x % 2 == 0)
        {
            printf("Positive even")_
        }
        else
        {
            printf("Positive odd")_
        }
    }
    return 0_
}`,
        answers: [";", ";", ";", ";"],
    },
];

export default syntaxSniperDrills;
