print("Hello, World!" \
      "This is a continuation of the previous line.")
print("This is another line of code.")
first_name = "John Doe"
last_name = "Smith"
full_name = first_name + " " + last_name # " "vaneko space dine ho bich ma
print("Hello, " + full_name)
print(type(full_name)) #prints data type of the variable full_name
age = 25
age += 5
print("your age is: " + str(age)) #str() converts the integer to string . string ma change nagare int rw character print hudaina 
height = 5.9 #float data 
print("your height is: " + str(height) + "cm") #str() converts the float to string
human = True #boolean data type
print("Are you a human? " + str(human)) #str() converts the boolean to string
science, math = 90, 85 #multiple variable assignment
print("Science: " + str(science) + ", Math: " + str(math))
english = nepali = 30
print("English: " + str(english) + ", Nepali: " + str(nepali))
hobbies = "reading"#starts with 0 
print(len(hobbies)) #len() function returns the length of the string
print(hobbies.find("i")) #find() function returns the index of the substring
print(hobbies.capitalize()) #capitalize() function capitalizes the first letter of the string
print(hobbies.upper()) #upper() function converts the string to uppercase
print(hobbies.lower()) #lower() function converts the string to lowercase
print(hobbies.replace("reading", "writing")) #replace() function replaces the substring with another substring
print(hobbies.isdigit()) #isdigit() function checks if the string is a digit
print(hobbies.isalpha()) #isalpha() function checks if the string is alphabetic
print(hobbies.count("i")) #count() function counts the number of occurrences of the substring
print(hobbies.startswith("r")) #startswith() function checks if the string starts with the substring
print(hobbies.endswith("g")) #endswith() function checks if the string ends with the substring
print(hobbies*3) #repeats the string 3 times
print(hobbies[0]) #prints the first character of the string
print(hobbies[1:4]) #prints characters from index 1 to 3
x = 1
y = 2.0
z = "3"
x = float(x) # change int to float
y = int(y)# change float to int
print(int(z)) #prints 3 in int not string  . this is temporary change of data type. z is still string for only this line
print(type(z))
print(x)
input_name = input("what is your name? ") #input() function takes input from the user
print("Hello," + input_name)
input_age = int(input("what is your age? ")) #input() function takes input from the user
input_age = input_age + 1 #converts the input string to integer
print("Next year, you will be " + str(input_age))