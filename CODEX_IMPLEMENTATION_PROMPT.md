# Prompt for the implementation task

Use GPT-5.6 Sol with Max reasoning for the main implementation task.

---

Work in `/Users/yon/Documents/Coursemobilerobotics`.

Implement the integrated UCSB XRP course software described in this folder: the `ucsb_xrp` MicroPython package, the Wi-Fi physical-target service, the browser IDE, the browser dashboard, and the Proposal 3B virtual XRP with deterministic planar motion and Three.js rendering.

Begin by reading, in order:

1. `PROJECT_CONTEXT.md`
2. `AGENTS.md`
3. `v2_01_course_overview_and_schedule.txt`
4. `v2_02_ucsb_xrp_library_user_guide.txt`
5. `v2_03_ucsb_xrp_api_reference.txt`
6. `SYSTEM_DESIGN.md`
7. `IMPLEMENTATION_PLAN.md`

Before repository setup or implementation, create
`docs/COURSE_AND_LIBRARY_SUMMARY.md`. Give a concise description of the course, all five challenges, and the library from the student's perspective. Explain what students implement, what is supplied, how a project is organized, and how data and commands move through the library. Check it against all three active course documents and include only genuine unresolved questions.

Then execute `IMPLEMENTATION_PLAN.md` in order. Work in vertical slices and obtain a complete working path early. At the end of each stage:

- demonstrate the result locally;
- run the relevant automated and browser tests;
- test the attached XRP whenever the stage involves physical behavior or communication;
- update `STATUS.md` with what works, what was actually tested, any limitation, and the next concrete task.

Continue from one stage to the next without waiting for routine approval. Ask only when hardware is inaccessible, external credentials are required, or a choice would materially alter the student experience or system architecture. If the task spans multiple Codex turns, use `STATUS.md` to resume rather than repeating completed work.

Preserve the central boundary: `ucsb_xrp` contains positioning, mapping, navigation, planning, and mission logic. The simulator provides virtual hardware, world geometry, sensor readings, collision state, and ground truth. It runs actual student MicroPython through MicroPython WebAssembly and a simulated XRPLib; it must not replace course algorithms with JavaScript versions.

Use current stable tools and libraries appropriate to mid-2026, while keeping dependencies and project structure modest. Prefer TypeScript, React, Vite, Monaco, Apache ECharts, and Three.js unless current evidence supports a materially better compatible choice. Keep the IDE and dashboard as separate applications with a small shared browser library and a common physical/virtual target interface.

Use the attached current SparkFun XRP to resolve firmware, XRPLib, wireless, motor, encoder, and sensor assumptions. The first implementation stage must prove both the GitHub Pages-to-XRP connection and the MicroPython WebAssembly path before substantial code depends on either one.

Do not stop at scaffolding or interface mockups. Controls described as working must work end to end. Keep the interfaces modern, calm, and legible, and keep student programs compact.
