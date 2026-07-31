# Project guidance

Begin with `PROJECT_CONTEXT.md` and follow its reading order.

## First deliverable

Before setting up the repository or writing implementation code, create
`docs/COURSE_AND_LIBRARY_SUMMARY.md` from the three active `v2_` documents. Check names, units, challenge progression, component ownership, and public interfaces against all three sources. Keep it concise and written for an instructor or student, not as an implementation plan.

## Working method

- Follow the evidence-gated vertical slices in `IMPLEMENTATION_PLAN.md`. Update
  their order when hardware evidence changes dependencies; record the reason in
  `STATUS.md`. Each slice must finish with a usable result and proportional
  tests.
- Work in complete vertical slices across the library, target interface, simulator, IDE, and dashboard. Do not let any one part advance far using an interface that the others have not exercised.
- After every stage, update `STATUS.md` with completed functionality, validation performed, known limitations, and the next concrete task. Continue to the next stage unless hardware access or a consequential design choice genuinely blocks progress.
- Keep `SYSTEM_DESIGN.md` current when implementation evidence changes a material decision. Avoid turning it into a development diary.
- Preserve the public course API unless a coordinated change clearly improves the course. If an API changes, update the library, reference and student implementations, examples, tests, and the three active course documents together.
- Use current stable dependencies that support the selected browser and MicroPython targets. Pin them in the normal lockfiles and keep the dependency set small.
- Test with the attached XRP whenever hardware behavior or browser-to-robot communication is involved. State plainly when a hardware test could not be run.
- Hardware tests default to no motion. Any command that can produce nonzero
  motor effort must be behind an explicit motion gate, use bounded effort and
  duration, begin and end with zero effort, and record structured evidence with
  the exact firmware, library, harness revision, and safety tier.
- Keep source files cohesive and names literal. Add an abstraction when it removes real duplication or isolates a necessary boundary.
- Run the relevant checks after each meaningful change and a full local check at each stage boundary.

The implementation may choose ordinary low-level details that are not fixed by the design documents. Record only decisions that affect interoperability, student use, deployment, or maintenance.
