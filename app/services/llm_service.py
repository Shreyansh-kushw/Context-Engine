from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from app.utils.config import settings

llm = ChatGroq(model=settings.groq_model, api_key=settings.groq_api_key)

prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "Answer the question based only on the provided chunks as context. If the answer is not in the provided context, say so.",
        ),
        ("human", "rrContext: \n\n{context}\n\nQuestion: {question}"),
    ]
)


async def generate_response(
    chunks: list[str],
    question: str,
):
    """Generates answer for the asked question based on the provided chunks as context using LLM API."""

    chain = prompt | llm

    response = await chain.ainvoke(
        {
            "context": f"""{"\n\n".join(chunks)}""",
            "question": question,
        }
    )

    return response.content
