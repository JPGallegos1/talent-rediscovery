# Validation Plan

## Goal

Validate whether recruiters experience enough pain around rediscovering candidates in their own Talent Pools to justify building Talent Rediscovery.

The first validation goal is not to prove the final product. It is to prove that this moment creates value:

> I uploaded or shared my Talent Pool, described what I needed, and found useful candidates I would otherwise have missed.

## Validation Principle

Validate through selling or manual delivery before building too much software.

The first version can be a concierge workflow:

1. Recruiter shares an anonymized CSV Talent Pool File or representative sample.
2. Recruiter describes a real or recent search.
3. We manually or semi-manually produce an ephemeral Shortlist.
4. Each Match includes reasons, evidence, gaps, and Suggested Next Action.
5. Recruiter reacts to usefulness, trust, missing data, and willingness to pay.

## Primary Assumptions

### Problem Hypothesis

Recruiters have Talent Pools that are underused because searching and reusing them is too time-consuming.

Validation signal: recruiters describe recent examples where they started from scratch despite having old candidate data.

### Value Hypothesis

A natural-language candidate rediscovery workflow reduces time to Shortlist from existing data.

Validation signal: recruiters say the Shortlist would have saved meaningful time or surfaced candidates they forgot.

### Trust Hypothesis

Recruiters need explanations, evidence, and gaps. A score alone is not enough.

Validation signal: recruiters inspect evidence and say it helps them trust or reject recommendations.

### Data Access Hypothesis

Recruiters are willing to provide at least anonymized candidate data for a useful result.

Validation signal: recruiters share a sample file, fake-but-realistic export, or agree to walk through their schema live.

### Payment Hypothesis

Recruiters or agencies will pay for rediscovery if it produces useful Shortlists from existing data.

Validation signal: recruiters agree to a paid manual pilot, Talent Pool audit, or beta subscription.

## Interview Targets

Talk to at least 10 recruiters before committing to a product build.

Minimum target mix:

- 3 freelance recruiters.
- 3 small agency recruiters or founders.
- 2 talent acquisition consultants.
- 2 internal HR or talent acquisition operators at small companies.

Proceed only if at least 3 show strong pull, such as asking for a demo, offering a file, introducing colleagues, or discussing price.

## Interview Questions

Use problem-first questions before describing the solution.

1. When a new search comes in, how do you check whether you already have candidates?
2. Where does your Talent Pool live today?
3. How often do you reuse old candidates?
4. What makes it hard to search your existing Talent Pool?
5. How long does it take to find viable candidates from your own data?
6. Have you ever sourced externally and later realized you already had someone in your base?
7. What fields are usually missing, stale, or unreliable?
8. How do you decide whether an old candidate is still worth contacting?
9. What would make you trust or distrust an AI-assisted Shortlist?
10. Would you upload an anonymized Talent Pool file to test this workflow?
11. If this saved you one hour per search, what would that be worth?
12. Would you pay for a one-off rediscovery report for one role?

## Concierge Test

Run this before relying on a built product.

### Input

- One Talent Pool file from a recruiter, preferably anonymized.
- One real or recent Search Request.
- Permission to return a Shortlist and ask follow-up questions.

### Output

- 5 to 10 recommended candidates.
- Qualitative Match strength per Match.
- Reasons for the Match.
- Evidence found in the data.
- Gaps or missing information.
- Suggested Next Action.
- Optional editable message draft when contact or recontact is the Suggested Next Action.

### Success Criteria

The concierge test is promising if the recruiter says at least one of:

- This found someone I would have missed.
- This saved me meaningful search time.
- I would use this on a real search.
- I would send another file or Search Request.
- I would pay for this if it worked reliably.

## Pricing Test

Test willingness to pay early with simple offers:

- One-off rediscovery report for a role: USD 25 to 100.
- Talent Pool audit and Shortlist package: USD 100 to 300.
- Private beta subscription for active recruiters: USD 20 to 50 per month.

The exact price matters less than crossing the free-to-paid threshold.

## Outreach Message

Spanish version:

```text
Hola, [Nombre]. Estoy validando una idea para recruiters y agencias.

La hipótesis es simple: muchas veces ya tienen buenos candidatos en Excels, ATS o bases viejas, pero no vuelven a consultarlas porque buscar ahí consume demasiado tiempo.

Estoy armando una demo donde podés subir una base y preguntarle en lenguaje natural:
"Buscame perfiles React con inglés y experiencia fintech"
y el sistema devuelve una Shortlist explicada.

¿Te pasa este problema o en tu caso tu base actual sí es fácil de reutilizar?
```

English version:

```text
Hi [Name], I am validating an idea for recruiters and small agencies.

The hypothesis is simple: many recruiters already have good candidates in spreadsheets, ATS exports, or old Talent Pools, but they do not reuse them because searching there takes too much time.

I am testing a workflow where you can upload a Talent Pool and ask in natural language:
"Find React profiles with English and fintech experience"
and receive an explained Shortlist from your own data.

Does this happen to you, or is your current Talent Pool already easy to reuse?
```

## Decision Gate

Do not start building beyond a lightweight demo until one of these is true:

- 10 conversations completed and at least 3 strong-pull signals observed.
- At least 1 recruiter completes a concierge test with real or anonymized data.
- At least 1 recruiter agrees to pay, prepay, or join a paid pilot.
