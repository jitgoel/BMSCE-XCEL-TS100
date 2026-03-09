import asyncio
from neo4j import GraphDatabase
import os
from dotenv import load_dotenv

load_dotenv("d:/PixelMinds/backend/.env")

uri = os.getenv("NEO4J_URI", "bolt://127.0.0.1:7687")
user = os.getenv("NEO4J_USER", "neo4j")
password = os.getenv("NEO4J_PASSWORD", "neo4j")

print(f"Connecting to {uri} as {user}...")
try:
    driver = GraphDatabase.driver(uri, auth=(user, password))
    driver.verify_connectivity()
    print("SUCCESS: Connected to Neo4j!")
    driver.close()
except Exception as e:
    print(f"FAILED: {e}")
