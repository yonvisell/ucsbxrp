import { useEffect, useMemo, useRef, useState } from "react";

import authoringInstructionsUrl from "../../../docs/INSTRUCTOR_CHALLENGE_AUTHORING.md?url";
import exampleSource from "../../../docs/examples/waypoint_slalom.challenge.json?raw";
import { CourseHeader } from "../../shared/CourseHeader";
import {
  registerOfflineShellBeforeReload,
  retryPendingOfflineShellReload,
} from "../../shared/offline-shell";
import {
  authoringCommand,
  challengeDraftProject,
  linesFromText,
  specificationFilename,
  suppliedFilesFromText,
  suppliedFilesToText,
  validateChallengeSpec,
  type ChallengeComponentSpec,
  type ChallengeSpec,
} from "./challenge-spec";
import {
  authorDraftQueryParameter,
  createAuthorDraftHandoff,
} from "../../shared/author-draft-handoff";
import {
  challengeAuthorDraftFingerprint,
  challengeAuthorReloadIsSafe,
} from "./author-release-reload";
import { WorldEditor } from "./WorldEditor";

const exampleSpec = JSON.parse(exampleSource) as ChallengeSpec;
const starterWorldSources = import.meta.glob(
  "../../../vendor/current/starters/challenge_*/world.json",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const sources = [
  ["challenge_1", "Challenge 1 · measured straight run"],
  ["challenge_2", "Challenge 2 · turn and return"],
  ["challenge_3", "Challenge 3 · ordered waypoints"],
  ["challenge_4", "Challenge 4 · mapped route"],
  ["challenge_5", "Challenge 5 · observe, plan, deliver"],
] as const;

const componentDefaults: ChallengeComponentSpec[] = [
  {
    file: "sensor_model.py",
    class_name: "SensorModel",
    selection_flag: "USE_STUDENT_SENSOR_MODEL",
    responsibility:
      "Convert timestamped encoder and range readings into measurements in course units.",
  },
  {
    file: "wheel_speed_controller.py",
    class_name: "WheelSpeedController",
    selection_flag: "USE_STUDENT_WHEEL_SPEED_CONTROLLER",
    responsibility:
      "Convert target and measured wheel speeds into bounded left and right drive commands.",
  },
  {
    file: "differential_drive.py",
    class_name: "DifferentialDrive",
    selection_flag: "USE_STUDENT_DIFFERENTIAL_DRIVE",
    responsibility:
      "Convert requested forward speed and turn rate into left and right wheel speeds.",
  },
  {
    file: "odometry.py",
    class_name: "Odometry",
    selection_flag: "USE_STUDENT_ODOMETRY",
    responsibility:
      "Update the estimated planar pose from measured left and right wheel travel.",
  },
  {
    file: "navigation_controller.py",
    class_name: "NavigationController",
    selection_flag: "USE_STUDENT_NAVIGATION_CONTROLLER",
    responsibility:
      "Advance through ordered goals and compute a bounded command from the current pose.",
  },
  {
    file: "grid_planner.py",
    class_name: "GridPlanner",
    selection_flag: "USE_STUDENT_GRID_PLANNER",
    responsibility:
      "Find a connected free-cell path from the requested start cell to the destination cell.",
  },
];

function clonedExample(): ChallengeSpec {
  return JSON.parse(exampleSource) as ChallengeSpec;
}

function starterWorld(sourceId: string): Record<string, unknown> | null {
  const matchingEntry = Object.entries(starterWorldSources).find(([path]) =>
    path.includes(`/starters/${sourceId}/world.json`),
  );
  return matchingEntry
    ? (JSON.parse(matchingEntry[1]) as Record<string, unknown>)
    : null;
}

function blankSpec(): ChallengeSpec {
  return {
    schema_version: 1,
    source_id: "challenge_1",
    id: "challenge_6",
    title: "",
    summary: "",
    objective: "",
    student_implementations: [],
    supplied_files: [],
    program_flow: "",
    evidence: [],
    work_sequence: [],
    world: starterWorld("challenge_1") ?? exampleSpec.world,
    files: {},
  };
}

function FieldHelp({ children }: { children: React.ReactNode }) {
  return <span className="field-help">{children}</span>;
}

export function AuthorApp() {
  const [spec, setSpec] = useState<ChallengeSpec>(clonedExample);
  const [worldSource, setWorldSource] = useState(() =>
    JSON.stringify(exampleSpec.world, null, 2),
  );
  const [filesSource, setFilesSource] = useState(() =>
    JSON.stringify(exampleSpec.files ?? {}, null, 2),
  );
  const [evidenceSource, setEvidenceSource] = useState(() =>
    exampleSpec.evidence.join("\n"),
  );
  const [sequenceSource, setSequenceSource] = useState(() =>
    exampleSpec.work_sequence.join("\n"),
  );
  const [suppliedSource, setSuppliedSource] = useState(() =>
    suppliedFilesToText(exampleSpec.supplied_files),
  );
  const [message, setMessage] = useState("");
  const currentDraftFingerprint = useMemo(
    () =>
      challengeAuthorDraftFingerprint({
        spec,
        worldSource,
        filesSource,
        evidenceSource,
        sequenceSource,
        suppliedSource,
      }),
    [
      evidenceSource,
      filesSource,
      sequenceSource,
      spec,
      suppliedSource,
      worldSource,
    ],
  );
  const reloadableSpecificationRef = useRef(currentDraftFingerprint);
  const currentSpecificationRef = useRef(currentDraftFingerprint);
  const fileInteractionActiveRef = useRef(false);
  const specificationInputRef = useRef<HTMLInputElement | null>(null);

  const currentSpec = useMemo(() => {
    const errors: string[] = [];
    let world: Record<string, unknown> = {};
    let files: Record<string, string> = {};
    try {
      world = JSON.parse(worldSource) as Record<string, unknown>;
    } catch (error) {
      errors.push(`World JSON: ${(error as Error).message}`);
    }
    try {
      files = JSON.parse(filesSource) as Record<string, string>;
    } catch (error) {
      errors.push(`Project file overrides: ${(error as Error).message}`);
    }
    const value: ChallengeSpec = {
      ...spec,
      supplied_files: suppliedFilesFromText(suppliedSource),
      evidence: linesFromText(evidenceSource),
      work_sequence: linesFromText(sequenceSource),
      world,
      files,
    };
    return {
      spec: value,
      errors: [...errors, ...validateChallengeSpec(value)],
    };
  }, [
    evidenceSource,
    filesSource,
    sequenceSource,
    spec,
    suppliedSource,
    worldSource,
  ]);

  const filename = specificationFilename(currentSpec.spec);
  const command = authoringCommand(filename);
  const overrideCount = Object.keys(currentSpec.spec.files ?? {}).length;
  currentSpecificationRef.current = currentDraftFingerprint;

  useEffect(
    () =>
      registerOfflineShellBeforeReload(() =>
        challengeAuthorReloadIsSafe(
          currentSpecificationRef.current,
          reloadableSpecificationRef.current,
          fileInteractionActiveRef.current,
        ),
      ),
    [],
  );

  useEffect(() => {
    if (
      challengeAuthorReloadIsSafe(
        currentDraftFingerprint,
        reloadableSpecificationRef.current,
        fileInteractionActiveRef.current,
      )
    ) {
      retryPendingOfflineShellReload();
    }
  }, [currentDraftFingerprint]);

  useEffect(() => {
    const input = specificationInputRef.current;
    if (!input) return;
    const finishCancelledSelection = () => {
      fileInteractionActiveRef.current = false;
      retryPendingOfflineShellReload();
    };
    input.addEventListener("cancel", finishCancelledSelection);
    return () => input.removeEventListener("cancel", finishCancelledSelection);
  }, []);

  function replaceExample(value: ChallengeSpec, reloadable = false) {
    const nextWorldSource = JSON.stringify(value.world, null, 2);
    const nextFilesSource = JSON.stringify(value.files ?? {}, null, 2);
    const nextEvidenceSource = value.evidence.join("\n");
    const nextSequenceSource = value.work_sequence.join("\n");
    const nextSuppliedSource = suppliedFilesToText(value.supplied_files);
    setSpec(value);
    setWorldSource(nextWorldSource);
    setFilesSource(nextFilesSource);
    setEvidenceSource(nextEvidenceSource);
    setSequenceSource(nextSequenceSource);
    setSuppliedSource(nextSuppliedSource);
    setMessage("");
    reloadableSpecificationRef.current = reloadable
      ? challengeAuthorDraftFingerprint({
          spec: value,
          worldSource: nextWorldSource,
          filesSource: nextFilesSource,
          evidenceSource: nextEvidenceSource,
          sequenceSource: nextSequenceSource,
          suppliedSource: nextSuppliedSource,
        })
      : "";
  }

  async function openSpecification(file: File | undefined) {
    if (!file) return;
    try {
      const value = JSON.parse(await file.text()) as unknown;
      const errors = validateChallengeSpec(value);
      if (errors.length > 0) {
        setMessage(`Specification not opened: ${errors[0]}`);
        return;
      }
      replaceExample(value as ChallengeSpec);
      setMessage(`${file.name} opened.`);
    } catch (error) {
      setMessage(`Specification not opened: ${(error as Error).message}`);
    }
  }

  function update<K extends keyof ChallengeSpec>(
    key: K,
    value: ChallengeSpec[K],
  ) {
    setSpec((current) => ({ ...current, [key]: value }));
  }

  function loadStartingWorld() {
    const world = starterWorld(spec.source_id);
    if (!world) {
      setMessage(`No example world is available for ${spec.source_id}.`);
      return;
    }
    setWorldSource(JSON.stringify(world, null, 2));
    setMessage(`Loaded the ${spec.source_id} example world.`);
  }

  function toggleComponent(
    component: ChallengeComponentSpec,
    selected: boolean,
  ) {
    const retained = spec.student_implementations.filter(
      (item) => item.class_name !== component.class_name,
    );
    update(
      "student_implementations",
      selected ? [...retained, component] : retained,
    );
  }

  function updateResponsibility(className: string, responsibility: string) {
    update(
      "student_implementations",
      spec.student_implementations.map((item) =>
        item.class_name === className ? { ...item, responsibility } : item,
      ),
    );
  }

  function updateComponent(
    index: number,
    field: keyof ChallengeComponentSpec,
    value: string,
  ) {
    update(
      "student_implementations",
      spec.student_implementations.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  }

  function addComponent() {
    update("student_implementations", [
      ...spec.student_implementations,
      { file: "", class_name: "", selection_flag: "", responsibility: "" },
    ]);
  }

  function removeComponent(index: number) {
    update(
      "student_implementations",
      spec.student_implementations.filter(
        (_item, itemIndex) => itemIndex !== index,
      ),
    );
  }

  function download() {
    if (currentSpec.errors.length > 0) {
      setMessage(
        "Correct the listed items before downloading the specification.",
      );
      return;
    }
    const blob = new Blob([JSON.stringify(currentSpec.spec, null, 2) + "\n"], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    reloadableSpecificationRef.current = currentSpecificationRef.current;
    setMessage(`${filename} downloaded. No repository files were changed.`);
    retryPendingOfflineShellReload();
  }

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(command);
      setMessage("Repository creation command copied.");
    } catch {
      setMessage("Copy was unavailable. Select the displayed command instead.");
    }
  }

  function openDraftInIde() {
    if (currentSpec.errors.length > 0) {
      setMessage("Correct the listed items before opening the project draft.");
      return;
    }
    try {
      const project = challengeDraftProject(currentSpec.spec);
      const token = createAuthorDraftHandoff({
        ...project,
        name: project.name ?? currentSpec.spec.title,
      });
      const ideUrl = new URL("../ide/", window.location.href);
      ideUrl.searchParams.set(authorDraftQueryParameter, token);
      const opened = window.open(ideUrl, "_blank");
      if (!opened) {
        setMessage(
          "The browser blocked the IDE tab. Allow this site to open a tab, then select Open draft in IDE again.",
        );
        return;
      }
      opened.opener = null;
      setMessage(
        "The unpublished project opened in the IDE. Save it to a Project folder before retaining or revising it.",
      );
    } catch (error) {
      setMessage(
        `The project draft could not be opened: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  const selectedClasses = new Set(
    spec.student_implementations.map((item) => item.class_name),
  );
  const defaultClasses = new Set(
    componentDefaults.map((component) => component.class_name),
  );
  const additionalComponents = spec.student_implementations
    .map((component, index) => ({ component, index }))
    .filter(({ component }) => !defaultClasses.has(component.class_name));

  return (
    <div className="author-app">
      <CourseHeader />
      <main className="author-shell">
        <header className="author-intro">
          <div>
            <h1>Challenge creation</h1>
            <p>
              Define a challenge and its world, then open the complete
              unpublished project in the IDE for testing. Download the checked
              specification when you are ready to retain or publish it. This
              page does not modify the repository or student catalog.
            </p>
          </div>
        </header>

        <div className="author-actions" aria-label="Specification examples">
          <label className="file-open-button">
            Open saved specification
            <input
              accept="application/json,.json"
              type="file"
              onClick={() => {
                fileInteractionActiveRef.current = true;
              }}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                void openSpecification(file).finally(() => {
                  fileInteractionActiveRef.current = false;
                  retryPendingOfflineShellReload();
                });
              }}
              ref={specificationInputRef}
            />
          </label>
          <button
            type="button"
            onClick={() => replaceExample(clonedExample(), true)}
          >
            Load working slalom example
          </button>
          <button type="button" onClick={() => replaceExample(blankSpec())}>
            Start a new specification
          </button>
        </div>

        <section className="author-section" aria-labelledby="structure-heading">
          <div className="section-number">1</div>
          <div>
            <h2 id="structure-heading">Select an existing program structure</h2>
            <p>
              Choose the published challenge whose control flow is closest to
              the new task. The later repository command copies that complete
              project; it does not combine unrelated challenge implementations.
            </p>
            <div className="field-grid">
              <label>
                Starting challenge
                <select
                  value={spec.source_id}
                  onChange={(event) => update("source_id", event.target.value)}
                >
                  {sources.map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
                <FieldHelp>
                  Determines the copied files and default mission flow.
                </FieldHelp>
                <button
                  className="inline-field-button"
                  type="button"
                  onClick={loadStartingWorld}
                >
                  Load this challenge&apos;s example world
                </button>
              </label>
              <label>
                Challenge ID
                <input
                  value={spec.id}
                  onChange={(event) => update("id", event.target.value)}
                  placeholder="challenge_6"
                />
                <FieldHelp>
                  Stable catalog and folder name; use challenge_N.
                </FieldHelp>
              </label>
              <label>
                Student-facing title
                <input
                  value={spec.title}
                  onChange={(event) => update("title", event.target.value)}
                />
              </label>
              <label>
                Catalog summary
                <input
                  value={spec.summary}
                  onChange={(event) => update("summary", event.target.value)}
                />
                <FieldHelp>
                  One sentence describing the observable task.
                </FieldHelp>
              </label>
            </div>
          </div>
        </section>

        <section className="author-section" aria-labelledby="learning-heading">
          <div className="section-number">2</div>
          <div>
            <h2 id="learning-heading">Define student work and evidence</h2>
            <label>
              Objective
              <textarea
                rows={4}
                value={spec.objective}
                onChange={(event) => update("objective", event.target.value)}
              />
              <FieldHelp>
                State what the robot does, what students implement, and the
                comparison or conclusion supported by measured evidence.
              </FieldHelp>
            </label>
            <fieldset>
              <legend>Student implementations</legend>
              <p className="field-help">
                Select only components whose implementation is assessed in this
                challenge. Edit the responsibility to make the boundary
                explicit.
              </p>
              <div className="component-list">
                {componentDefaults.map((component) => {
                  const selected = selectedClasses.has(component.class_name);
                  const current = spec.student_implementations.find(
                    (item) => item.class_name === component.class_name,
                  );
                  return (
                    <div className="component-row" key={component.class_name}>
                      <label className="component-choice">
                        <input
                          checked={selected}
                          type="checkbox"
                          onChange={(event) =>
                            toggleComponent(component, event.target.checked)
                          }
                        />
                        <code>{component.class_name}</code>
                      </label>
                      <textarea
                        aria-label={`${component.class_name} responsibility`}
                        disabled={!selected}
                        rows={2}
                        value={
                          current?.responsibility ?? component.responsibility
                        }
                        onChange={(event) =>
                          updateResponsibility(
                            component.class_name,
                            event.target.value,
                          )
                        }
                      />
                    </div>
                  );
                })}
                {additionalComponents.map(
                  ({ component, index }, visibleIndex) => (
                    <div
                      className="additional-component-row"
                      key={`additional-${index}`}
                    >
                      <label>
                        File
                        <input
                          aria-label={`Additional component ${visibleIndex + 1} file`}
                          placeholder="localizer.py"
                          value={component.file}
                          onChange={(event) =>
                            updateComponent(index, "file", event.target.value)
                          }
                        />
                      </label>
                      <label>
                        Class
                        <input
                          aria-label={`Additional component ${visibleIndex + 1} class`}
                          placeholder="Localizer"
                          value={component.class_name}
                          onChange={(event) =>
                            updateComponent(
                              index,
                              "class_name",
                              event.target.value,
                            )
                          }
                        />
                      </label>
                      <label>
                        Selection flag
                        <input
                          aria-label={`Additional component ${visibleIndex + 1} selection flag`}
                          placeholder="USE_STUDENT_LOCALIZER"
                          value={component.selection_flag}
                          onChange={(event) =>
                            updateComponent(
                              index,
                              "selection_flag",
                              event.target.value,
                            )
                          }
                        />
                      </label>
                      <label>
                        Responsibility
                        <textarea
                          aria-label={`Additional component ${visibleIndex + 1} responsibility`}
                          placeholder="State the inputs, required result, and retained state."
                          rows={2}
                          value={component.responsibility}
                          onChange={(event) =>
                            updateComponent(
                              index,
                              "responsibility",
                              event.target.value,
                            )
                          }
                        />
                      </label>
                      <button
                        aria-label={`Remove additional component ${visibleIndex + 1}`}
                        type="button"
                        onClick={() => removeComponent(index)}
                      >
                        Remove
                      </button>
                    </div>
                  ),
                )}
                <button
                  className="add-component-button"
                  type="button"
                  onClick={addComponent}
                >
                  Add another component
                </button>
                <FieldHelp>
                  A new component also needs complete file overrides for its
                  module, course_setup.py integration, and hardware-free
                  examples in component_checks.py.
                </FieldHelp>
              </div>
            </fieldset>
            <div className="field-grid text-grid">
              <label>
                Required evidence — one item per line
                <textarea
                  rows={6}
                  value={evidenceSource}
                  onChange={(event) => setEvidenceSource(event.target.value)}
                />
              </label>
              <label>
                Student work sequence — one step per line
                <textarea
                  rows={6}
                  value={sequenceSource}
                  onChange={(event) => setSequenceSource(event.target.value)}
                />
              </label>
            </div>
          </div>
        </section>

        <section className="author-section" aria-labelledby="project-heading">
          <div className="section-number">3</div>
          <div>
            <h2 id="project-heading">Define the supplied project</h2>
            <div className="field-grid text-grid">
              <label>
                Supplied files and services — name | use
                <textarea
                  rows={8}
                  value={suppliedSource}
                  onChange={(event) => setSuppliedSource(event.target.value)}
                />
                <FieldHelp>
                  Include world.json once and describe each supplied item
                  objectively.
                </FieldHelp>
              </label>
              <label>
                Program sequence — one step per line
                <textarea
                  rows={8}
                  value={spec.program_flow}
                  onChange={(event) =>
                    update("program_flow", event.target.value)
                  }
                />
                <FieldHelp>
                  State the execution order in short sentences and name the data
                  passed between important parts.
                </FieldHelp>
              </label>
            </div>
            <div className="world-editor-field">
              <h3>World configuration</h3>
              <p className="field-help">
                Arrange the measured arena, initial XRP pose, obstacles, and
                markers. Waypoints enter the route in the order shown. Geometry
                outside the arena is reported rather than moved automatically.
              </p>
              <WorldEditor source={worldSource} onChange={setWorldSource} />
            </div>
            <details>
              <summary>
                Project-file overrides · {overrideCount || "none"}
                {overrideCount === 1
                  ? " file"
                  : overrideCount > 1
                    ? " files"
                    : ""}
              </summary>
              <p>
                Leave this as <code>{"{}"}</code> to retain the copied working
                code. To change the mission structure, map project-relative file
                names to complete text. Python files are syntax-checked before
                draft creation.
              </p>
              <textarea
                aria-label="Project file overrides as JSON"
                className="code-input large-code-input"
                rows={14}
                spellCheck={false}
                value={filesSource}
                onChange={(event) => setFilesSource(event.target.value)}
              />
            </details>
          </div>
        </section>

        <section className="author-section" aria-labelledby="review-heading">
          <div className="section-number">4</div>
          <div>
            <h2 id="review-heading">Review and open the project</h2>
            <div
              className={
                currentSpec.errors.length === 0 ? "review-ok" : "review-errors"
              }
              role="status"
            >
              {currentSpec.errors.length === 0 ? (
                <p>
                  Specification checks pass. Open the unpublished project in the
                  IDE to compile and run the actual files.
                </p>
              ) : (
                <>
                  <p>{currentSpec.errors.length} item(s) require attention:</p>
                  <ul>
                    {currentSpec.errors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
            <div className="draft-row">
              <button
                className="primary-button"
                disabled={currentSpec.errors.length > 0}
                title={
                  currentSpec.errors.length > 0
                    ? "Resolve the listed specification errors before opening the project"
                    : "Build this unpublished project and open it in a new IDE tab"
                }
                type="button"
                onClick={openDraftInIde}
              >
                Open draft in IDE
              </button>
              <span className="field-help">
                The IDE receives the copied starting project, generated README,
                edited world, and any complete file overrides shown above.
              </span>
            </div>
            <div className="create-row">
              <button
                disabled={currentSpec.errors.length > 0}
                title={
                  currentSpec.errors.length > 0
                    ? "Resolve the listed specification errors before downloading"
                    : "Download this checked challenge specification"
                }
                type="button"
                onClick={download}
              >
                Download checked specification
              </button>
              <button type="button" onClick={copyCommand}>
                Copy repository command
              </button>
              <code>{command}</code>
            </div>
            <nav
              aria-label="Challenge authoring references"
              className="author-reference-links"
            >
              <a href={authoringInstructionsUrl}>Authoring instructions</a>
              <a href="../overview/#authoring">Technical overview</a>
            </nav>
            <p className="field-help">
              After downloading the JSON, an instructor may run this command
              from the UCSBXRP repository. It creates an unpublished project and
              runs repository checks. Review and test that project before using
              the separate publication command described in Authoring
              instructions.
            </p>
            <p aria-live="polite" className="author-message">
              {message}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
