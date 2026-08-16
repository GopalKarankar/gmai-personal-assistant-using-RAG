import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance

load_dotenv()

client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY"),
)

collection = os.getenv("QDRANT_COLLECTION")

# Use the same vector size your application uses
VECTOR_SIZE = 384

client.delete_collection(collection)

client.create_collection(
    collection_name=collection,
    vectors_config=VectorParams(
        size=VECTOR_SIZE,
        distance=Distance.COSINE,
    ),
)

print("Collection recreated successfully.")