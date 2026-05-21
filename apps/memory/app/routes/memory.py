from fastapi import APIRouter

from app.domain.models import (
    MemoryRetrieveRequest,
    MemoryRetrieveResponse,
    ExtractedField,
    ProposeNoteRequest,
    ProposeNoteResponse,
)

router = APIRouter(prefix="/memory", tags=["memory"])


@router.post("/retrieve")
async def retrieve_memory(request: MemoryRetrieveRequest) -> MemoryRetrieveResponse:
    records = request.context.records
    notes = request.context.notes
    search = request.context.search_request

    skill_count = sum(len(r.skills) for r in records)
    industries = {ind for r in records for ind in r.industries}

    return MemoryRetrieveResponse(
        summary=(
            f"Candidate has {len(records)} record(s) with {skill_count} skill(s) "
            f"across {len(industries)} industry area(s) and {len(notes)} confirmed note(s)."
        ),
        extracted_fields=[
            ExtractedField(name="skills_count", value=str(skill_count), source="candidate_records"),
            ExtractedField(name="industries", value=", ".join(sorted(industries)) if industries else "none", source="candidate_records"),
            ExtractedField(name="notes_count", value=str(len(notes)), source="candidate_notes"),
        ],
        gaps=(
            [] if search is None
            else ["No candidate records match requested criteria." if not records else ""]
        ),
        next_steps=(
            ["Review candidate records for match relevance."]
            if records
            else ["Request additional candidate data before matching."]
        ),
    )


@router.post("/propose-note")
async def propose_note(request: ProposeNoteRequest) -> ProposeNoteResponse:
    return ProposeNoteResponse(
        proposed_note=f"Recruiter input: {request.raw_input}",
        source_type="transcribed" if len(request.raw_input.split()) > 5 else "typed",
        confidence="medium",
        reasoning="Derived from raw input without confirming details against records.",
    )
