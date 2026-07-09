#include <stdio.h>

int main() {
    for (int j = 1; j <= 10; j++) {
        for (int i = 1; i <= 10; i++) {
            printf("%d x %d = %-3d\t", i, j, i * j);
        }
        printf("\n");
    }

    return 0;
}