from pydantic import BaseModel, Field
from typing import Literal


class CandidateRecordSummary(BaseModel):
    id: str
    source_file: str | None = None
    skills: list[str] = Field(default_factory=list)
    role: str | None = None
    years_experience: float | None = None
    location: str | None = None
    english_level: str | None = None
    industries: list[str] = Field(default_factory=list)
    availability: str | None = None


class CandidateNoteSummary(BaseModel):
    id: str
    content: str
    created_at: str | None = None
    source_type: str | None = None


class CandidateMemoryContext(BaseModel):
    candidate_id: str
    records: list[CandidateRecordSummary] = Field(default_factory=list)
    notes: list[CandidateNoteSummary] = Field(default_factory=list)
    search_request: str | None = None


class MemoryRetrieveRequest(BaseModel):
    context: CandidateMemoryContext


class ExtractedField(BaseModel):
    name: str
    value: str
    source: str


class MemoryRetrieveResponse(BaseModel):
    summary: str
    extracted_fields: list[ExtractedField] = Field(default_factory=list)
    gaps: list[str] = Field(default_factory=list)
    next_steps: list[str] = Field(default_factory=list)


class ProposeNoteRequest(BaseModel):
    context: CandidateMemoryContext
    raw_input: str


class ProposeNoteResponse(BaseModel):
    proposed_note: str
    source_type: Literal["transcribed", "typed"]
    confidence: Literal["high", "medium", "low"]
    reasoning: str
