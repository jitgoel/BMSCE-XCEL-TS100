import asyncio
from neo4j import GraphDatabase
import os
from dotenv import load_dotenv
import json

load_dotenv("d:/PixelMinds/backend/.env")

uri = os.getenv("NEO4J_URI", "bolt://127.0.0.1:7687")
user = os.getenv("NEO4J_USER", "neo4j")
password = os.getenv("NEO4J_PASSWORD", "neo4j")

print(f"Connecting to {uri} as {user}...")
try:
    driver = GraphDatabase.driver(uri, auth=(user, password))
    
    with driver.session() as session:
        # Check Node Counts
        summary = session.run("MATCH (n) RETURN labels(n) as label, count(*) as count")
        print("\n--- Node Counts ---")
        for record in summary:
            print(f"{record['label'][0] if record['label'] else 'Unknown'}: {record['count']}")
            
        # Check Relationship Counts
        rel_summary = session.run("MATCH ()-[r]->() RETURN type(r) as type, count(*) as count")
        print("\n--- Relationship Counts ---")
        for record in rel_summary:
            print(f"{record['type']}: {record['count']}")
            
        # Get Candidates
        candidates = session.run("MATCH (c:Candidate) RETURN c.id as id, c.name as name LIMIT 5")
        print("\n--- Recent Candidates ---")
        has_candidates = False
        for record in candidates:
            has_candidates = True
            print(f"Candidate: {record['name']} (ID: {record['id']})")
            
            # Get traits for this candidate
            traits = session.run(
                "MATCH (c:Candidate {id: $id})-[r:HAS_TRAIT]->(t:Trait) "
                "RETURN t.name as trait, r.score as score "
                "ORDER BY r.score DESC LIMIT 5",
                id=record['id']
            )
            print("  Top 5 Traits:")
            for t_record in traits:
                print(f"    - {t_record['trait']}: {t_record['score']}")
                
        if not has_candidates:
            print("No Candidates found in the database. Did you submit the onboarding form from the frontend?")
            
    driver.close()
except Exception as e:
    print(f"FAILED: {e}")
