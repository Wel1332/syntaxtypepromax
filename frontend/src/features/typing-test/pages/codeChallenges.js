// src/data/codeChallenges.js

const codeChallenges = [
  // =========================
  // 🟢 EASY LEVEL
  // =========================
  {
    id: 1,
    difficulty: "easy",
    question: "Determine if a number is Even or Odd.",
    code: `#include <stdio.h>

int main() {
    ___ number;

    printf("Enter an integer: ");
    scanf("___", &number);

    if (number %___  == 0) {
        printf("Even\\n");
    } else {
        printf("Odd\\n");
    }

    return 0;
}`,
    answers: ["int", "%d", "2"]
  },

  {
    id: 2,
    difficulty: "easy",
    question: "Find the largest of two numbers.",
    code: `#include <stdio.h>

int main() {
    int a, b;

    printf("Enter two numbers: ");
    scanf("%d %d", &a, &b);

    if (a ___ b)
        printf("A is larger");
    else
        printf("B is larger");

    return 0;
}`,
    answers: [">"]
  },
  {
  id: 3,
  difficulty: "easy",
  question: "Check if number is positive or negative.",
  code: `#include <stdio.h>

int main() {
    int num;

    scanf("___", &___);

    if (num ___ 0)
        printf("Positive");
    ___
        printf("Negative");

    return ___;
}`,
  answers: ["%d","num",">","else","0"]
},
{
  id: 4,
  difficulty: "easy",
  question: "Check if character is vowel.",
  code: `#include <stdio.h>

int main() {
    char ch;

    scanf("___", &___);

    if (ch == '___' || ch == '___' || ch == '___'
        || ch == '___' || ch == '___')
        printf("Vowel");
    else
        printf("Consonant");

    return ___;
}`,
  answers: ["%c","ch","a","e", "i", "o", "u", "0"]
},
{
  id: 5,
  difficulty: "easy",
  question: "Print numbers from 1 to 5 using a loop.",
  code: `#include <stdio.h>

int main() {
    int i;

    for(i = ___; i <= 5; i++) {
        printf("%d ", i);
    }

    return ___;
}`,
  answers: ["1", "0"]
},

  // =========================
  // 🟡 MEDIUM LEVEL
  // =========================
  {
    id: 6,
    difficulty: "medium",
    question: "Check whether a number is Prime.",
    code: `#include <stdio.h>

int main() {
    int number, i, flag = 0;

    printf("Enter number: ");
    scanf("___", &number);

    for (i = 2; i <= number / 2; i++) {
        if (number % i == 0) {
            flag = 1;
            ___;
        }
    }

    if (flag == 0)
        printf("Prime");
    else
        printf("Not Prime");

    return 0;
}`,
    answers: ["%d", "break"]
  },

  {
    id: 7,
    difficulty: "medium",
    question: "Reverse a number using a loop.",
    code: `#include <stdio.h>

int main() {
    int number, reversed = 0, remainder;

    printf("Enter number: ");
    scanf("%d", &number);

    while (number ___ 0) {
        remainder = number % 10;
        reversed = reversed * 10 + remainder;
        number = number ___ 10;
    }

    printf("Reversed: %d", reversed);

    return 0;
}`,
    answers: [">", "/"]
  },
  {
  id: 8,
  difficulty: "medium",
  question: "Find the sum of digits of a number.",
  code: `#include <stdio.h>

int main() {
    int number, sum = 0, remainder;

    scanf("___", &number);

    while (number ___ 0) {
        remainder = number % ___ ;
        sum = sum + remainder;
        number = number ___ 10;
    }

    printf("Sum: %d", sum);

    return 0;
}`,
  answers: ["%d", ">", "10", "/"]
},
{
  id: 9,
  difficulty: "medium",
  question: "Find the factorial of a number.",
  code: `#include <stdio.h>

int main() {
    int i, num;
    int fact = 1;

    scanf("___", &num);

    for(i = 1; i ___ num; i++) {
        fact = ___ * i;
    }

    printf("Factorial: %d", fact);

    return 0;
}`,
  answers: ["%d", "<=", "fact"]
},
{
  id: 10,
  difficulty: "medium",
  question: "Count the digits of a number.",
  code: `#include <stdio.h>

int main() {
    int number, count = 0;

    scanf("___", &number);

    while(number ___ 0){
        number = number ___ 10;
        count++;
    }

    printf("Digits: %d", count);

    return 0;
}`,
  answers: ["%d", "!=", "/"]
},

  // =========================
  // 🔴 HARD LEVEL
  // =========================
  {
    id: 11,
    difficulty: "hard",
    question: "Find the second largest number in an array.",
    code: `#include <stdio.h>

int main() {
    int arr[5] = {4, 8, 1, 9, 3};
    int i;
    int largest = arr[0];
    int second = -1;

    for (i = 1; i < 5; i++) {
        if (arr[i] ___ largest) {
            second = largest;
            largest = arr[i];
        }
        else if (arr[i] ___ second && arr[i] ___ largest) {
            second = ___;
        }
    }

    printf("Second Largest: %d", second);

    return 0;
}`,
    answers: [">", ">", "!=", "arr[i]"]
  },

  {
    id: 12,
    difficulty: "hard",
    question: "Check if a number is a Palindrome.",
    code: `#include <stdio.h>

int main() {
    int number, original, reversed = 0, remainder;

    printf("Enter number: ");
    scanf("%d", &number);

    original = number;

    while (number != ___) {
        remainder = number % 10;
        reversed = reversed * 10 + ___;
        number = number / 10;
    }

    if (original ___ reversed)
        printf("Palindrome");
    else
        printf("Not Palindrome");

    return 0;
}`,
    answers: ["0","remainder","=="]
  },
  {
  id: 13,
  difficulty: "hard",
  question: "Bubble sort ascending.",
  code: `#include <stdio.h>

int main() {
    int arr[5]={5,2,8,1,3};
    int i,j,temp;

    for(i=0;i<___;i++){
        for(j=0;j<___;j++){
            if(arr[j] ___ arr[j+1]){
                temp=arr[j];
                arr[j]=arr[j+1];
                arr[j+1]=temp;
            }
        }
    }

    return ___;
}`,
  answers: ["4","4-i",">","0"]
},
{
  id: 14,
  difficulty: "hard",
  question: "Check if a number is a Perfect Number.",
  code: `#include <stdio.h>

int main() {
    int num, i, sum = 0;

    scanf("___", &___);

    for(i = 1; i ___ num; i++){
        if(num % i ___ 0){
            sum = sum ___ i;
        }
    }

    if(sum ___ num)
        printf("Perfect Number");
    else
        printf("Not Perfect");

    return 0;
}`,
  answers: ["%d","num","<","==","+","=="]
},
{
  id: 15,
  difficulty: "hard",
  question: "Find the missing number in a sequence from 1 to 5.",
  code: `#include <stdio.h>

int main() {
    int arr[4] = {1,2,3,5};
    int i, sum = 0;
    int total = 15;

    for(i = 0; i < ___; i++){
        sum = sum ___ arr[i];
    }

    printf("Missing number: %d", total ___ sum);

    return 0;
}`,
  answers: ["4", "+", "-",]
},
];

export default codeChallenges;
