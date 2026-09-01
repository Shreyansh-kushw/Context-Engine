from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq

from app.utils.config import settings

llm = ChatGroq(model=settings.groq_model, api_key=settings.groq_api_key)

prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "Answer the question based only on the provided chunks as context. If the answer is not in the provided context, say so.",
        ),
        ("human", "Context: \n\n{context}\n\nQuestion: {question}"),
    ]
)


async def generate_response(
    chunks: list[str],
    question: str,
):
    """Generates answer for the asked question based on the provided chunks as context using LLM API."""

    chain = prompt | llm

    context_block = "\n\n".join(
        f"[Source: {c.source_filename}, p,{c.page_number}]\n{c.chunk_text}\n"
        for c in chunks
    )

    response = await chain.ainvoke(
        {
            "context": context_block,
            "question": question,
        }
    )

    return {
        "answer": response.content,
        "sources": [
            {"filename": c.source_filename, "page": c.page_number}
            for c in chunks
        ],
    }