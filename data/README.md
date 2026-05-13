# Synthetic Demo Talent Pool

This directory contains a safe synthetic Talent Pool File for prototype demos and tests. It does not contain real recruiter or Candidate data.

## Files

- `synthetic-candidate-records.csv`: CSV-first Talent Pool File with synthetic Candidate Records that future prototype upload code can load directly.

## Included Candidate Record Fields

The CSV includes candidate name, current role, skills, years of experience, location, English level, industries, availability, source, last contact date, salary expectation, and notes.

## Intentional Imperfections

The dataset intentionally includes missing, stale, duplicated, vague, and mixed-language data so matching can surface evidence, gaps, risks, and a Suggested Next Action.

Examples:

- Missing values: Nicolas Herrera lacks years of experience, English level, and salary expectation.
- Stale records: Mateo Ruiz, Nicolas Herrera, Sofia Ramos duplicate, and Pablo Rios have old last contact dates.
- Duplicate Candidate Records: Sofia Ramos appears twice with overlapping but inconsistent details.
- Vague data: Nicolas Herrera has `Node-ish`, `Maybe available`, and uncertain backend notes.
- Mixed-language data: Lucia Vega and Pablo Rios include Spanish phrases in skills, availability, or notes.

## Demo Search Request

```text
I need a Senior Backend Engineer in Bogota or remote Colombia, Python or Node, at least 4 years of experience, fintech or startup background, intermediate English or better, and availability within 30 days.
```

This Search Request should produce a useful Shortlist with strong and possible Matches, while also exposing gaps and risks such as stale contact dates, missing English levels, duplicate Candidate Records, uncertain availability, and role mismatches.
