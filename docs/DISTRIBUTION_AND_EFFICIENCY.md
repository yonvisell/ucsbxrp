# Web application efficiency and distribution

> Historical size snapshot. The current package composition and optimization
> priorities are recorded in `docs/CURRENT_PRODUCT_OUTCOMES.md`; remeasure
> before using the byte or asset counts below.

## Current result

The production `dist` directory is a self-contained static release. It contains
the landing page, IDE, Monitor, commissioning wizard, guide, local workers,
Monaco, ECharts, Three.js, MicroPython WebAssembly, the public course release,
reference bytecode, project templates, the pinned RP2350 firmware, service
worker, offline manifest, and third-party notices. No CDN, application server,
or remote runtime asset is required.

The Monitor imports only the ECharts line-chart, grid, title, legend, tooltip,
and canvas-renderer modules it uses. The initial reduction moved its minified
JavaScript from 1,687,014 to 1,081,536 bytes and gzip size from 511,939 to
315,685 bytes without changing behavior. Combined SVG/PNG figures,
telemetry-driven WebM replay, and timestamped annotations bring the current
Monitor to 1,096,724 bytes minified and 319,454 bytes under ordinary gzip: an
increase of 15,188 and 3,769 bytes respectively, with no new package. Export
canvases, SVG strings, and media encoders exist only while an export is being
made.

The complete self-commissioning release is 9,122,960 bytes across 183 verified
payloads. Its largest addition remains the exact 1,725,952-byte RP2350 UF2
needed for repair after the computer leaves internet Wi-Fi. The commissioning
application is 33,204 bytes minified and about 10.9 kB gzip.

The lockfile pins patched DOMPurify 3.4.13 and Nano ID 3.3.18 releases where
the current Monaco and Vite dependency trees otherwise selected vulnerable
patch levels. `npm audit` reports no remaining production or development
advisories.

Further changes such as lazy-loading the editor, batching telemetry renders, or
replacing the Three.js trail buffer would add lifecycle and timing complexity.
Current bounded histories, workers, ring-buffer recordings, and disposal paths
do not show a defect that justifies those changes. Reassess only if profiling on
course laptops identifies a real latency or memory problem.

## GitHub Pages packaging

`.github/workflows/pages.yml` builds and validates the static artifact, then
publishes `dist` using the supported GitHub Pages artifact workflow. It obtains
the deployment base path from GitHub Pages itself, so the same workflow handles
both forms:

- `https://yonvisell.github.io/` when the repository is `yonvisell.github.io`;
- `https://yonvisell.github.io/<repository>/` for an ordinary project
  repository.

The public repository is `yonvisell/ucsbxrp`. Its Pages source is GitHub
Actions; pushes to `main` deploy automatically, and `workflow_dispatch` allows
an explicit deployment.

The repository also has no root license for the UCSB course-tool source itself.
That does not prevent its owner from publishing the site, but it leaves reuse
rights unspecified. Choose a course-source license before inviting external
reuse; none was inferred in this maintenance slice.

The generated service worker caches the complete release and supplies the
cross-origin-isolation headers required by the virtual MicroPython runtime.
From an HTTPS Pages deployment, current Chrome requires permission before a
worker can contact the XRP's HTTP service on the local network. The physical
client now makes that permission-triggering document request first and marks
device requests as local-network traffic. Students accept the browser's local
network prompt once. Chrome or Edge remains the supported course browser.

Before first public use, validate the deployed URL—not only `localhost`—in the
course browser:

1. open the commissioning wizard, IDE, Monitor, and guide at their final Pages
   paths;
2. wait for the app-specific **available offline** status;
3. reload the applications with networking disabled and run one virtual
   project;
4. restore networking, run one USB commission/repair, join the selected robot
   network, grant local-network access, and exercise connect, flash, run, stop,
   and telemetry against an XRP.

The physical step must be repeated at the final HTTPS origin because browser
permissions are origin-specific. It cannot be completed while the XRP is
disconnected.

## Resource and archive audit

No source was archived in this slice. The candidates below provide negligible
runtime or distribution savings, while moving them now would remove useful
provenance or create avoidable reference churn.

| Candidate | Finding | Recommendation |
| --- | --- | --- |
| `packages/osc` | Tested prototype, but no production module imports it; the current target uses the versioned JSON/HTTP service. | Archive in a later documentation cleanup if OSC is formally retired. It has no effect on the built apps today. |
| `CODEX_IMPLEMENTATION_PROMPT.md` and early design-review documents | Historical implementation evidence; not active course authority. | Move together under `archived/` only after checking and updating every documentation link. |
| `docs/hardware/*.json` | Small, structured evidence for firmware and physical regressions. | Keep. These records distinguish measured behavior from simulator claims. |
| `vendor/current` | Public course source, starters, templates, examples, and reference bytecode used by both targets. | Keep and publish, excluding `reference_source` as the build already does. |
| `dist`, `node_modules`, `.venv`, `test-results`, `.DS_Store` | Generated or machine-local and already ignored by Git. | Do not archive or publish. Regenerate or delete locally when disk space matters. |
| `.git-archives` | Local rollback bundles, ignored by Git and absent from the web release. | Keep until the public repository and release tags provide equivalent recovery. |

The build now includes license and notice files for every installed production
dependency under `third-party-licenses/`. This material is generated from the
pinned packages; the npm MicroPython package's omitted upstream MIT license is
kept in `vendor/licenses` and copied into the release.

## Local deployment-path validation

Use a representative project path before publishing:

```sh
COURSE_BASE_PATH=/ucsb-xrp/ npm run check:fast
COURSE_BASE_PATH=/ucsb-xrp/ npx playwright test tests/e2e/offline.spec.ts
```

Finish with an ordinary root build before leaving the local preview running:

```sh
npm run build
npm run preview -- --port 4174
```
