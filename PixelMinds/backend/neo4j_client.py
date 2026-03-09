"""
Neo4j Graph Database Client
Stores candidate traits as a graph: Candidate → HAS_TRAIT → Trait nodes.
"""

import os
from neo4j import GraphDatabase
from dotenv import load_dotenv

load_dotenv()

NEO4J_URI = os.getenv("NEO4J_URI", "neo4j://127.0.0.1:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "neo4j")

NEO4J_AVAILABLE = False
_driver = None

try:
    _driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    _driver.verify_connectivity()
    NEO4J_AVAILABLE = True
    print("[neo4j_client] Connected to Neo4j successfully")
except Exception as e:
    print(f"[neo4j_client] Neo4j unavailable ({e}). Graph storage disabled.")


def close_driver():
    """Close Neo4j driver on shutdown."""
    global _driver
    if _driver:
        _driver.close()


def store_candidate_traits(
    candidate_id: str,
    traits: dict,
    name: str = "",
    email: str = "",
):
    """
    Create/update a Candidate node and connect to Trait nodes.

    Graph structure:
        (:Candidate {id, name, email})
          -[:HAS_TRAIT {score}]->
        (:Trait {name})
    """
    if not NEO4J_AVAILABLE or not _driver:
        return

    with _driver.session() as session:
        # Create/merge the Candidate node
        session.run(
            """
            MERGE (c:Candidate {id: $id})
            SET c.name = $name, c.email = $email, c.updated_at = datetime()
            """,
            id=candidate_id,
            name=name,
            email=email,
        )

        # Create Trait nodes and HAS_TRAIT relationships
        for trait_name, score in traits.items():
            session.run(
                """
                MERGE (t:Trait {name: $trait_name})
                WITH t
                MATCH (c:Candidate {id: $candidate_id})
                MERGE (c)-[r:HAS_TRAIT]->(t)
                SET r.score = $score, r.updated_at = datetime()
                """,
                trait_name=trait_name,
                candidate_id=candidate_id,
                score=round(score, 4),
            )


def get_candidate_traits(candidate_id: str) -> dict:
    """Fetch all traits for a candidate from Neo4j."""
    if not NEO4J_AVAILABLE or not _driver:
        return {}

    with _driver.session() as session:
        result = session.run(
            """
            MATCH (c:Candidate {id: $id})-[r:HAS_TRAIT]->(t:Trait)
            RETURN t.name AS trait, r.score AS score
            ORDER BY r.score DESC
            """,
            id=candidate_id,
        )
        return {record["trait"]: record["score"] for record in result}
