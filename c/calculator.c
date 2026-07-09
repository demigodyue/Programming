#include <stdio.h>
int main (){
    int a , b;
    char operator;
    printf("enter first number: ");
    scanf("%d", &a);
    printf("enter operator: ");
    scanf(" %c", &operator);
    printf("enter second number: ");
    scanf("%d", &b);
    if (operator == '+'){
        printf("%d + %d = %d", a, b , a + b);
    }else if (operator == '-'){
        printf("%d - %d = %d", a, b , a - b);
}else if (operator == '*'){
        printf("%d * %d = %d", a, b , a * b);
    }else if (operator == '/'){
        printf("%d / %d = %d", a, b , a / b);
    }else{
        printf("invalid operator");
    }
    return 0;
}