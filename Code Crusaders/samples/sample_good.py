"""
Sample: Good Code (for demonstration purposes)
This file follows best practices and clean code principles.
"""

import os
import hashlib
import sqlite3
import logging
from dataclasses import dataclass, field
from typing import Optional
from pathlib import Path
from functools import lru_cache

# Configure logging
logger = logging.getLogger(__name__)


@dataclass
class User:
    """Represents a user with validated fields."""
    name: str
    email: str
    role: str = "user"
    department: str = ""

    def __post_init__(self):
        if "@" not in self.email:
            raise ValueError(f"Invalid email format: {self.email}")


class UserRepository:
    """Handles user data persistence with parameterized queries."""

    def __init__(self, db_path: str = "users.db"):
        self.db_path = db_path

    def get_user_by_id(self, user_id: int) -> Optional[dict]:
        """Fetch user by ID using parameterized query to prevent SQL injection."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
                return cursor.fetchone()
        except sqlite3.DatabaseError as e:
            logger.error("Database error fetching user %d: %s", user_id, e)
            return None


class AuthService:
    """Handles authentication with secure password hashing."""

    @staticmethod
    def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
        """Hash password with salt using SHA-256."""
        if salt is None:
            salt = os.urandom(32).hex()
        hashed = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000)
        return hashed.hex(), salt


# Constants instead of magic numbers
CELSIUS_TO_FAHRENHEIT_FACTOR = 1.8
CELSIUS_TO_FAHRENHEIT_OFFSET = 32


def convert_celsius_to_fahrenheit(celsius: float) -> float:
    """Convert Celsius temperature to Fahrenheit."""
    return (celsius * CELSIUS_TO_FAHRENHEIT_FACTOR) + CELSIUS_TO_FAHRENHEIT_OFFSET


@lru_cache(maxsize=128)
def fibonacci(n: int) -> int:
    """Compute the nth Fibonacci number with memoization."""
    if n < 0:
        raise ValueError("n must be a non-negative integer")
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)


def read_file_safely(filepath: str) -> Optional[str]:
    """Read a file with proper error handling and resource management."""
    path = Path(filepath)
    if not path.exists():
        logger.warning("File not found: %s", filepath)
        return None
    try:
        return path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError) as e:
        logger.error("Error reading file %s: %s", filepath, e)
        return None
