from sentence_transformers import SentenceTransformer

model = SentenceTransformer("BAAI/bge-base-en-v1.5")


def generate_embeddings(chunk: str):
    """Generates and returns a list of embeddings of all the chunks."""

    return model.encode(chunk)
