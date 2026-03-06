"""
Sample: Bad Code (for demonstration purposes)
This file intentionally contains bugs, security issues, and anti-patterns.
"""

import os

# Hardcoded credentials - SECURITY ISSUE
DATABASE_PASSWORD = "admin123"
API_SECRET = "sk-abc123secret"

def get_user_data(user_id):
    import sqlite3
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    # SQL Injection vulnerability
    query = "SELECT * FROM users WHERE id = '%s'" % user_id
    cursor.execute(query)
    data = cursor.fetchone()
    return data

def calculate_discount(price, discount):
    # No input validation
    # Division by zero possible
    final_price = price - (price * discount / 100)
    return final_price

def process_data(data):
    # Bare except - catches everything including SystemExit
    try:
        result = eval(data)  # eval() is dangerous!
        return result
    except:
        return None

def read_file(filename):
    # No file existence check, no encoding specified
    f = open(filename, "r")
    content = f.read()
    # File handle never closed - resource leak
    return content

class UserManager:
    def __init__(self):
        self.users = []
    
    def add_user(self, name, email, password, age, role, department, phone, address):
        # Too many parameters - God function
        user = {
            "name": name,
            "email": email,
            "password": password,  # Storing plaintext password!
            "age": age,
            "role": role,
            "department": department,
            "phone": phone,
            "address": address,
        }
        self.users.append(user)
        return True
    
    def find_user(self, name):
        # Inefficient linear search
        for user in self.users:
            if user["name"] == name:
                return user
        return None
    
    # TODO: implement delete_user
    # FIXME: add_user doesn't validate email format

def fibonacci(n):
    # Extremely inefficient recursive implementation
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# Magic numbers everywhere
def convert_temperature(temp):
    return (temp * 1.8) + 32
