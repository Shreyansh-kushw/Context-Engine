from sentence_transformers import SentenceTransformer

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")


def generate_embeddings(chunk: str):
    """Generates and returns a list of embeddings of all the chunks."""

    return model.encode(chunk)
