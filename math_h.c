#include <stdio.h>
#include <math.h>
int main (){
    int a;
    printf("enter number: ");
    scanf("%d", &a);
    printf("square of %d is %d\n", a , a * a);
    printf("cube of %d is %d\n", a , a * a * a);
    printf("square root of %d is %.2f\n", a , sqrt(a));
    printf("cube root of %d is %.2f\n", a , cbrt(a));
    printf("power of %d is %.2f\n", a , pow(a, 2));
    printf("power of %d is %.2f\n", a , pow(a, 3));
        return 0;
}