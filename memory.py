import chromadb
from chromadb.config import Settings

client = chromadb.Client(Settings(anonymized_telemetry=False))
collection = client.get_or_create_collection("user_preferences")

def save_preference(key: str, value: str):
    collection.upsert(documents=[value], ids=[key])

def get_preference(key: str) -> str:
    results = collection.get(ids=[key])
    if results["documents"]:
        return results["documents"][0]
    return None