// Syntax Sniper drill banks.
//
// Each `_` in `code` is a single-character blank; `answers[i]` is the
// expected char for the i-th underscore (left-to-right reading order).
//
// `practiceBank` and `testBank` are deliberately distinct sets so students
// who drill in Practice don't memorise the Pre-/Post-Test items. Each bank has
// five drills for each of the course's four topics (shared/assessment/topics.js).
//
// Ids carry a 2 (P2-, T2-): every drill played is stored by id in
// drill_attempts, so reusing a first-set id would mix two questions' results.

export const practiceBank = [
    {
        id: "P2-01",
        title: "Print your name",
        topic: "basics",
        difficulty: "easy",
        code: `int main()
{
    printf("My name is Ana")_
    return 0_
}`,
        answers: [";", ";"],
    },
    {
        id: "P2-02",
        title: "Age next year",
        topic: "basics",
        difficulty: "easy",
        code: `int main()
{
    int age = 15_
    printf("%d"_ age + 1)_
    return 0_
}`,
        answers: [";", ",", ";", ";"],
    },
    {
        id: "P2-03",
        title: "Price of two",
        topic: "basics",
        difficulty: "medium",
        code: `int main()
{
    float price = 2.5_
    float total = price * 2_
    printf("%.2f"_ total)_
    return 0_
}`,
        answers: [";", ";", ",", ";", ";"],
    },
    {
        id: "P2-04",
        title: "Read a number",
        topic: "basics",
        difficulty: "medium",
        code: `int main()
{
    int num_
    scanf("%d"_ &num)_
    printf("You typed %d"_ num)_
    return 0_
}`,
        answers: [";", ",", ";", ",", ";", ";"],
    },
    {
        id: "P2-05",
        title: "Show a grade",
        topic: "basics",
        difficulty: "easy",
        code: `int main()
{
    char grade = 'A'_
    printf("Grade: %c"_ grade)_
    return 0_
}`,
        answers: [";", ",", ";", ";"],
    },
    {
        id: "P2-06",
        title: "Pass or fail",
        topic: "conditionals",
        difficulty: "easy",
        code: `int main()
{
    int score = 80_
    if (score >= 75)
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
        id: "P2-07",
        title: "Positive number",
        topic: "conditionals",
        difficulty: "easy",
        code: `int main()
{
    int n = 5_
    if (n > 0)
    {
        printf("positive")_
    }
    return 0_
}`,
        answers: [";", ";", ";"],
    },
    {
        id: "P2-08",
        title: "Bigger number",
        topic: "conditionals",
        difficulty: "medium",
        code: `int main()
{
    int a = 7_
    int b = 3_
    if (a > b)
    {
        printf("%d"_ a)_
    }
    else
    {
        printf("%d"_ b)_
    }
    return 0_
}`,
        answers: [";", ";", ",", ";", ",", ";", ";"],
    },
    {
        id: "P2-09",
        title: "Hot, warm or cold",
        topic: "conditionals",
        difficulty: "medium",
        code: `int main()
{
    int temp = 30_
    if (temp > 32)
    {
        printf("hot")_
    }
    else if (temp > 20)
    {
        printf("warm")_
    }
    else
    {
        printf("cold")_
    }
    return 0_
}`,
        answers: [";", ";", ";", ";", ";"],
    },
    {
        id: "P2-10",
        title: "Menu choice",
        topic: "conditionals",
        difficulty: "medium",
        code: `int main()
{
    int choice = 2_
    switch (choice)
    {
        case 1: printf("Start")_ break_
        case 2: printf("Quit")_ break_
    }
    return 0_
}`,
        answers: [";", ";", ";", ";", ";", ";"],
    },
    {
        id: "P2-11",
        title: "Count to 3",
        topic: "loops",
        difficulty: "easy",
        code: `int main()
{
    for (int i = 1_ i <= 3_ i++)
    {
        printf("%d "_ i)_
    }
    return 0_
}`,
        answers: [";", ";", ",", ";", ";"],
    },
    {
        id: "P2-12",
        title: "Say hi 3 times",
        topic: "loops",
        difficulty: "easy",
        code: `int main()
{
    int i = 0_
    while (i < 3)
    {
        printf("hi ")_
        i++_
    }
    return 0_
}`,
        answers: [";", ";", ";", ";"],
    },
    {
        id: "P2-13",
        title: "Add 1 to 10",
        topic: "loops",
        difficulty: "medium",
        code: `int main()
{
    int sum = 0_
    for (int i = 1_ i <= 10_ i++)
    {
        sum = sum + i_
    }
    printf("%d"_ sum)_
    return 0_
}`,
        answers: [";", ";", ";", ";", ",", ";", ";"],
    },
    {
        id: "P2-14",
        title: "Countdown",
        topic: "loops",
        difficulty: "medium",
        code: `int main()
{
    int n = 5_
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
        id: "P2-15",
        title: "Do-while",
        topic: "loops",
        difficulty: "medium",
        code: `int main()
{
    int x = 1_
    do
    {
        printf("%d "_ x)_
        x++_
    } while (x <= 3)_
    return 0_
}`,
        answers: [";", ",", ";", ";", ";", ";"],
    },
    {
        id: "P2-16",
        title: "Hello function",
        topic: "functions",
        difficulty: "easy",
        code: `void sayHello()
{
    printf("Hello")_
}

int main()
{
    sayHello()_
    return 0_
}`,
        answers: [";", ";", ";"],
    },
    {
        id: "P2-17",
        title: "Double it",
        topic: "functions",
        difficulty: "medium",
        code: `int twice(int n)
{
    return n * 2_
}

int main()
{
    int r = twice(4)_
    printf("%d"_ r)_
    return 0_
}`,
        answers: [";", ";", ",", ";", ";"],
    },
    {
        id: "P2-18",
        title: "Add two numbers",
        topic: "functions",
        difficulty: "medium",
        code: `int add(int a_ int b)
{
    return a + b_
}

int main()
{
    printf("%d"_ add(2_ 3))_
    return 0_
}`,
        answers: [",", ";", ",", ",", ";", ";"],
    },
    {
        id: "P2-19",
        title: "Draw two lines",
        topic: "functions",
        difficulty: "easy",
        code: `void line()
{
    printf("-----")_
}

int main()
{
    line()_
    line()_
    return 0_
}`,
        answers: [";", ";", ";", ";"],
    },
    {
        id: "P2-20",
        title: "Is it even?",
        topic: "functions",
        difficulty: "hard",
        code: `int isEven(int n)
{
    if (n % 2 == 0)
    {
        return 1_
    }
    return 0_
}

int main()
{
    printf("%d"_ isEven(6))_
    return 0_
}`,
        answers: [";", ";", ",", ";", ";"],
    },
];

export const testBank = [
    {
        id: "T2-01",
        title: "Greeting",
        topic: "basics",
        difficulty: "easy",
        code: `int main()
{
    printf("Good morning")_
    return 0_
}`,
        answers: [";", ";"],
    },
    {
        id: "T2-02",
        title: "Year of birth",
        topic: "basics",
        difficulty: "easy",
        code: `int main()
{
    int year = 2010_
    printf("Born in %d"_ year)_
    return 0_
}`,
        answers: [";", ",", ";", ";"],
    },
    {
        id: "T2-03",
        title: "Area of a rectangle",
        topic: "basics",
        difficulty: "medium",
        code: `int main()
{
    int length = 4_
    int width = 3_
    int area = length * width_
    printf("%d"_ area)_
    return 0_
}`,
        answers: [";", ";", ";", ",", ";", ";"],
    },
    {
        id: "T2-04",
        title: "Read your age",
        topic: "basics",
        difficulty: "medium",
        code: `int main()
{
    int age_
    scanf("%d"_ &age)_
    printf("Age: %d"_ age)_
    return 0_
}`,
        answers: [";", ",", ";", ",", ";", ";"],
    },
    {
        id: "T2-05",
        title: "Average of two",
        topic: "basics",
        difficulty: "medium",
        code: `int main()
{
    float a = 85.5_
    float b = 90.0_
    printf("%.1f"_ (a + b) / 2)_
    return 0_
}`,
        answers: [";", ";", ",", ";", ";"],
    },
    {
        id: "T2-06",
        title: "Can vote?",
        topic: "conditionals",
        difficulty: "easy",
        code: `int main()
{
    int age = 17_
    if (age >= 18)
    {
        printf("Can vote")_
    }
    else
    {
        printf("Too young")_
    }
    return 0_
}`,
        answers: [";", ";", ";", ";"],
    },
    {
        id: "T2-07",
        title: "Negative number",
        topic: "conditionals",
        difficulty: "easy",
        code: `int main()
{
    int n = -4_
    if (n < 0)
    {
        printf("negative")_
    }
    return 0_
}`,
        answers: [";", ";", ";"],
    },
    {
        id: "T2-08",
        title: "Odd or even",
        topic: "conditionals",
        difficulty: "medium",
        code: `int main()
{
    int x = 9_
    if (x % 2 == 0)
    {
        printf("%d is even"_ x)_
    }
    else
    {
        printf("%d is odd"_ x)_
    }
    return 0_
}`,
        answers: [";", ",", ";", ",", ";", ";"],
    },
    {
        id: "T2-09",
        title: "Letter grade",
        topic: "conditionals",
        difficulty: "medium",
        code: `int main()
{
    int score = 85_
    if (score >= 90)
    {
        printf("A")_
    }
    else if (score >= 80)
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
        id: "T2-10",
        title: "Day name",
        topic: "conditionals",
        difficulty: "hard",
        code: `int main()
{
    int day = 1_
    switch (day)
    {
        case 1: printf("Monday")_ break_
        case 2: printf("Tuesday")_ break_
        default: printf("Other day")_
    }
    return 0_
}`,
        answers: [";", ";", ";", ";", ";", ";", ";"],
    },
    {
        id: "T2-11",
        title: "Print stars",
        topic: "loops",
        difficulty: "easy",
        code: `int main()
{
    for (int i = 0_ i < 4_ i++)
    {
        printf("*")_
    }
    return 0_
}`,
        answers: [";", ";", ";", ";"],
    },
    {
        id: "T2-12",
        title: "Count to 5",
        topic: "loops",
        difficulty: "medium",
        code: `int main()
{
    int n = 1_
    while (n <= 5)
    {
        printf("%d "_ n)_
        n++_
    }
    return 0_
}`,
        answers: [";", ",", ";", ";", ";"],
    },
    {
        id: "T2-13",
        title: "Total of 1 to 5",
        topic: "loops",
        difficulty: "medium",
        code: `int main()
{
    int total = 0_
    for (int i = 1_ i <= 5_ i++)
    {
        total += i_
    }
    printf("Total: %d"_ total)_
    return 0_
}`,
        answers: [";", ";", ";", ";", ",", ";", ";"],
    },
    {
        id: "T2-14",
        title: "Count down by 2",
        topic: "loops",
        difficulty: "medium",
        code: `int main()
{
    for (int i = 10_ i > 0_ i -= 2)
    {
        printf("%d "_ i)_
    }
    return 0_
}`,
        answers: [";", ";", ",", ";", ";"],
    },
    {
        id: "T2-15",
        title: "Read until zero",
        topic: "loops",
        difficulty: "hard",
        code: `int main()
{
    int n_
    do
    {
        scanf("%d"_ &n)_
    } while (n != 0)_
    return 0_
}`,
        answers: [";", ",", ";", ";", ";"],
    },
    {
        id: "T2-16",
        title: "Welcome function",
        topic: "functions",
        difficulty: "easy",
        code: `void welcome()
{
    printf("Welcome!")_
}

int main()
{
    welcome()_
    return 0_
}`,
        answers: [";", ";", ";"],
    },
    {
        id: "T2-17",
        title: "Square a number",
        topic: "functions",
        difficulty: "medium",
        code: `int square(int n)
{
    return n * n_
}

int main()
{
    int s = square(6)_
    printf("%d"_ s)_
    return 0_
}`,
        answers: [";", ";", ",", ";", ";"],
    },
    {
        id: "T2-18",
        title: "Multiply two numbers",
        topic: "functions",
        difficulty: "medium",
        code: `int multiply(int a_ int b)
{
    return a * b_
}

int main()
{
    printf("%d"_ multiply(4_ 5))_
    return 0_
}`,
        answers: [",", ";", ",", ",", ";", ";"],
    },
    {
        id: "T2-19",
        title: "Show a number",
        topic: "functions",
        difficulty: "easy",
        code: `void show(int n)
{
    printf("Number: %d"_ n)_
}

int main()
{
    show(7)_
    return 0_
}`,
        answers: [",", ";", ";", ";"],
    },
    {
        id: "T2-20",
        title: "Is it positive?",
        topic: "functions",
        difficulty: "hard",
        code: `int isPositive(int n)
{
    if (n > 0)
    {
        return 1_
    }
    return 0_
}

int main()
{
    printf("%d"_ isPositive(-3))_
    return 0_
}`,
        answers: [";", ";", ",", ";", ";"],
    },
];

// Default export retained for legacy callers — combined view of both banks.
const allDrills = [...practiceBank, ...testBank];
export default allDrills;
