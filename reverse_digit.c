#include <stdio.h>

int main() {
    int num, reverse = 0, digit;

    printf("Enter an integer: ");
    scanf("%d", &num);

    while (num != 0) {
        digit = num % 10;           // Get the last digit
        reverse = reverse * 10 + digit; // Add it to the reversed number
        num = num / 10;             // Remove the last digit
    }

    printf("Reversed number = %d\n", reverse);

    return 0;
}
/*Suppose the number is:

1234

We want the result to be:

4321
Step 1: Get the last digit
digit = num % 10;

% 10 gives the last digit.

Example:

1234 % 10 = 4
567 % 10 = 7
98 % 10 = 8

So if

num = 1234;

then

digit = 4;
Step 2: Add it to the reversed number

Initially,

reverse = 0;

Then

reverse = reverse * 10 + digit;

Substitute the values:

reverse = 0 * 10 + 4
        = 4
Step 3: Remove the last digit
num = num / 10;

Since num is an int, the decimal part is discarded.

1234 / 10 = 123
123 / 10 = 12
12 / 10 = 1
1 / 10 = 0

Now

num = 123
Repeat the steps
First iteration
num = 1234
digit = 4
reverse = 4
num = 123
Second iteration
digit = 123 % 10 = 3

reverse = 4 * 10 + 3
        = 43

num = 123 / 10
    = 12
Third iteration
digit = 2

reverse = 43 * 10 + 2
        = 432

num = 1
Fourth iteration
digit = 1

reverse = 432 * 10 + 1
        = 4321

num = 0

The loop stops because num is now 0.*/