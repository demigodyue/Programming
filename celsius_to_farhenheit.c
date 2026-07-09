#include <stdio.h>
int main (){
    printf("To convert Celsius to Fahrenheit, enter the temperature in Celsius: ");
    float celsius;
    scanf("%f", &celsius);
    float fahrenheit = (celsius * 9 / 5) + 32;
    printf("%.2f Celsius is equal to %.2f Fahrenheit\n", celsius, fahrenheit);
    return 0;
    
}