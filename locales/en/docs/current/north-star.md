# North Star: Research and Design Stage (No Back-Compat Blockers)

> Live SSoT for this repository. Criterion for analysis, ADRs, and refactors.

1. **Active design stage:** The repository is in a research, design, and architecture-validation stage.
2. **Zero back-compat blockers:** In technical analysis, ADR design, and refactors, preserving backwards compatibility with old schemas, inherited files, obsolete tables, or prior contracts **must never be a blocker**.
3. **Clean cut preferred:** If an architectural refactor (decoupling, simplification, cost reduction, removing a SPOF) breaks compatibility with previous structures, take the clean cut. Do not accumulate zombie code or unnecessary defensive fallbacks.
4. **Live SSoT:** Current code and policy win. Document migrations in the ADR or the handoff; do not tie future design to dead layouts or contracts.
5. **Quick checklist:**
   - Does it improve decoupling, clarity, or operating cost? Proceed.
   - Does backwards compatibility add complexity, ambiguity, or extra code? Drop it and cut clean.
   - Is there a data or configuration migration? Document it explicitly and execute the change.
