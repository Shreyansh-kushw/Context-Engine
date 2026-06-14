from pydantic import BaseModel, Field

class QueryRequest(BaseModel):
    """Class for request body of qna endpoint"""

    query: str = Field(description="Query to be answered.")
    filename: str = Field(description="File name for the file in question.")
