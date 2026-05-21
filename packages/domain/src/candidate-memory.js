export function splitMatchEvidenceByMemorySource(evidence) {
  return {
    candidateRecordEvidence: evidence.filter((item) => item.source === "Candidate Record"),
    candidateNoteEvidence: evidence.filter((item) => item.source === "Candidate Note"),
  };
}

export function formatProvenanceChips(provenance) {
  if (!provenance) {
    return ["Provenance unavailable"];
  }

  const confirmationChip = provenance.confirmerId
    ? `Confirmed by ${provenance.confirmerId}`
    : "Not human-confirmed";
  const uncertaintyChip = provenance.uncertainty ? [`Uncertain: ${provenance.uncertainty}`] : [];
  const stalenessChip = provenance.staleness ? [`Stale: ${provenance.staleness}`] : [];

  return [
    `Source: ${provenance.sourceType}`,
    confirmationChip,
    ...uncertaintyChip,
    ...stalenessChip,
  ];
}

export function deriveCandidateMemoryGaps(candidateRecords) {
  const gaps = candidateRecords.flatMap((candidateRecord) => {
    const missingFieldGaps = candidateRecord.gaps
      .filter((gap) => gap.field !== "name")
      .map((gap) => `Missing Candidate Record field: ${gap.label}.`);
    const staleContactGap = isStaleLastContact(candidateRecord.canonicalFields.lastContactDate)
      ? [`Last contact may be stale: ${candidateRecord.canonicalFields.lastContactDate}.`]
      : [];

    return [...missingFieldGaps, ...staleContactGap];
  });

  return [...new Set(gaps)];
}

function isStaleLastContact(value) {
  const year = Number.parseInt(String(value).slice(0, 4), 10);

  return Number.isFinite(year) && year < 2026;
}
