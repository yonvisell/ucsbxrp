import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";

function projectFiles(directory: string): Record<string, string> {
  const files: Record<string, string> = {};
  const visit = (current: string) => {
    for (const name of readdirSync(current)) {
      const path = join(current, name);
      if (statSync(path).isDirectory()) {
        visit(path);
      } else {
        files[relative(directory, path).replaceAll("\\", "/")] = readFileSync(
          path,
          "utf8",
        );
      }
    }
  };
  visit(directory);
  return files;
}

test("landing page exposes the instructor tools as compact text links", async ({
  page,
}) => {
  await page.goto("/");
  const authorLink = page.getByRole("link", {
    name: "challenge creation wizard",
  });
  const overviewLink = page.getByRole("link", {
    name: "overview of UCSBXRP",
  });
  await expect(authorLink).toHaveAttribute("href", "./author/");
  await expect(overviewLink).toHaveAttribute("href", "./overview/");
  await expect(authorLink.locator("xpath=..")).toContainText(
    "challenge creation wizard • overview of UCSBXRP",
  );
});

test("specification editor validates and downloads the complete curriculum example", async ({
  page,
}) => {
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  await page.goto("/author/");

  await expect(
    page.getByRole("heading", {
      name: "UCSBXRP challenge specification editor",
    }),
  ).toBeVisible();
  await expect(page.getByLabel("Starting challenge")).toHaveValue(
    "challenge_3",
  );
  await expect(page.getByLabel("Challenge ID")).toHaveValue("challenge_6");
  await expect(
    page.getByText(
      "Specification checks pass. No repository files have been created or checked.",
    ),
  ).toBeVisible();
  await expect(
    page.getByText(
      "python3 scripts/challenge_authoring.py create --spec challenge_6.challenge.json",
    ),
  ).toBeVisible();

  await page.getByLabel("Starting challenge").selectOption("challenge_2");
  await expect(
    page.getByText("challenge_2 source requires a waypoint named turn."),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Load this challenge's example world" })
    .click();
  await expect(
    page.getByText("Loaded the challenge_2 example world."),
  ).toBeVisible();
  await page
    .locator('.file-open-button input[type="file"]')
    .setInputFiles("docs/examples/waypoint_slalom.challenge.json");
  await expect(
    page.getByText("waypoint_slalom.challenge.json opened."),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Specification checks pass. No repository files have been created or checked.",
    ),
  ).toBeVisible();

  await page.getByRole("button", { name: "Add another component" }).click();
  await expect(
    page.getByText("Student implementation 2 is incomplete."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Download checked specification" }),
  ).toBeDisabled();
  await page.getByLabel("Additional component 1 file").fill("localizer.py");
  await page.getByLabel("Additional component 1 class").fill("Localizer");
  await page
    .getByLabel("Additional component 1 responsibility")
    .fill("Estimate the robot pose from the supplied landmark observations.");
  await expect(
    page.getByText(
      "Student implementation 2 needs a complete localizer.py project-file override.",
    ),
  ).toBeVisible();
  await page.getByText("Optional project-file overrides").click();
  const overrideEditor = page.getByLabel("Project file overrides as JSON");
  const originalOverrideSource = await overrideEditor.inputValue();
  const overrides = JSON.parse(originalOverrideSource) as Record<
    string,
    string
  >;
  overrides["localizer.py"] = "class Localizer:\n    pass\n";
  await overrideEditor.fill(JSON.stringify(overrides, null, 2));
  await expect(
    page.getByText(
      "Specification checks pass. No repository files have been created or checked.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Download checked specification" }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Remove additional component 1" })
    .click();
  await overrideEditor.fill(originalOverrideSource);

  const downloadEvent = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download checked specification" })
    .click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe("challenge_6.challenge.json");

  await page
    .getByRole("button", { name: "Start a blank specification" })
    .click();
  await expect(page.getByText(/item\(s\) require attention/)).toBeVisible();
  await expect(
    page.getByText("Title must be one nonempty line."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Download checked specification" }),
  ).toBeDisabled();

  await page
    .getByRole("button", { name: "Load working slalom example" })
    .click();
  await expect(
    page.getByText(
      "Specification checks pass. No repository files have been created or checked.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Authoring instructions" }),
  ).toHaveAttribute("href", /INSTRUCTOR_CHALLENGE_AUTHORING.*\.md$/);
  await expect(
    page.getByRole("link", { name: "Technical overview" }),
  ).toHaveAttribute("href", "../overview/#authoring");
  expect(browserErrors).toEqual([]);
});

test("specification editor remains readable at phone width", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 760 });
  await page.goto("/author/");
  await expect(
    page.getByRole("heading", {
      name: "UCSBXRP challenge specification editor",
    }),
  ).toBeVisible();
  const geometry = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
  const labelFontSize = await page
    .getByLabel("Starting challenge")
    .evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize),
    );
  expect(labelFontSize).toBeGreaterThanOrEqual(14);
  const commandFontSize = await page
    .locator(".create-row code")
    .evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize),
    );
  expect(commandFontSize).toBeGreaterThanOrEqual(14);
});

test("instructor overview states the system boundaries and release workflow", async ({
  page,
}) => {
  await page.goto("/overview/");
  await expect(
    page.getByRole("heading", {
      name: "UCSBXRP instructor system reference",
    }),
  ).toBeVisible();
  for (const heading of [
    "Challenge sequence",
    "Runtime architecture",
    "Project structure",
    "Virtual and physical targets",
    "Challenge authoring",
    "Release, offline operation, and validation",
    "Release checks",
  ]) {
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }
  await expect(
    page.getByRole("link", { name: "Create or revise a challenge" }),
  ).toHaveAttribute("href", "../author/");
  await expect(page.locator("#components")).toContainText(
    "XRPBot, Robot, StraightLineController, ArenaMap, OccupancyGrid, and DeliveryMission",
  );
  await expect(page.locator("#authoring")).toContainText(
    "The browser does not create repository files or publish a challenge.",
  );
});

test("generated Waypoint Slalom runs in the virtual XRP and exports telemetry", async ({
  context,
  page: ide,
}) => {
  test.setTimeout(150_000);
  const draftRoot = mkdtempSync(join(tmpdir(), "ucsbxrp-author-e2e-"));
  try {
    cpSync("vendor/current", join(draftRoot, "vendor/current"), {
      recursive: true,
    });
    execFileSync(
      "python3",
      [
        "scripts/challenge_authoring.py",
        "--root",
        draftRoot,
        "create",
        "--spec",
        "docs/examples/waypoint_slalom.challenge.json",
      ],
      { stdio: "pipe" },
    );
    const files = projectFiles(
      join(draftRoot, "vendor/current/starters/challenge_6"),
    );
    await context.addInitScript(() => {
      Object.defineProperty(window, "showSaveFilePicker", {
        configurable: true,
        value: undefined,
      });
    });
    await ide.addInitScript((generatedFiles: Record<string, string>) => {
      localStorage.clear();
      localStorage.setItem(
        "ucsb-xrp-course-project-v1",
        JSON.stringify({
          name: "Waypoint Slalom",
          entrypoint: "main.py",
          files: generatedFiles,
        }),
      );
    }, files);

    await ide.goto("/ide/");
    const monitor = await context.newPage();
    await monitor.goto("/monitor/");
    await monitor
      .getByRole("button", { name: "Start recording", exact: true })
      .click();

    await ide.getByRole("button", { name: "Validate" }).click();
    await expect(ide.getByTestId("check-result")).toContainText(
      "compiled with MicroPython",
    );
    await ide.getByRole("button", { name: "Run", exact: true }).click();
    await expect(ide.getByRole("log")).toContainText(
      "Waypoint Slalom complete",
      { timeout: 80_000 },
    );
    await expect(ide.getByTestId("target-status")).toContainText(
      "Virtual XRP · ready",
    );
    await expect
      .poll(
        async () =>
          Number.parseFloat(
            (await monitor.getByTestId("x-mm").textContent()) ?? "NaN",
          ),
        { message: "the generated route should advance through the world" },
      )
      .toBeGreaterThan(900);

    await monitor
      .getByRole("button", { name: "Stop recording", exact: true })
      .click();
    const downloadEvent = monitor.waitForEvent("download");
    await monitor.getByRole("button", { name: "Export telemetry CSV" }).click();
    const download = await downloadEvent;
    expect(download.suggestedFilename()).toMatch(/^xrp-telemetry-.*\.csv$/);
    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();
    const csv = readFileSync(downloadPath!, "utf8");
    expect(csv.split("\n").length).toBeGreaterThan(10);
    expect(csv).toContain("target_left_wheel_speed_mm_s");
  } finally {
    rmSync(draftRoot, { recursive: true, force: true });
  }
});
