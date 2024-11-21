import random
import time

ITER = 100000
NUMS = 7
MIN = 1
MAX = 40

print("Starting...")
print("Generating numbers...")

matrix = []
for i in range(ITER):
    print("Iteration %d" % i)
    row = []
    for j in range(NUMS):
        num = random.randint(MIN, MAX)
        row.append(num)
    matrix.append(row)


open('data.txt', 'w').write(str(matrix))

print("Finished")
