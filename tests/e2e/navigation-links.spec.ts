import { expect, test } from "@playwright/test";

const entryPages = [
  "/",
  "/ide/",
  "/monitor/",
  "/workspace/",
  "/guide/",
  "/reference/",
  "/commission/",
  "/author/",
  "/overview/",
];

test("student and instructor pages have valid internal links and fragments", async ({
  page,
}) => {
  const internalLinks = new Set<string>();

  for (const entryPage of entryPages) {
    const response = await page.goto(entryPage);
    expect(response?.ok(), `${entryPage} should load`).toBe(true);
    await expect(page.locator("main")).toBeVisible();
    const origin = new URL(page.url()).origin;
    for (const href of await page
      .locator("a[href]")
      .evaluateAll((links) =>
        links.map((link) => link.getAttribute("href") ?? ""),
      )) {
      const target = new URL(href, page.url());
      if (target.origin === origin) internalLinks.add(target.toString());
    }
  }

  for (const href of internalLinks) {
    const response = await page.goto(href);
    if (response) {
      expect(response.ok(), `${href} should load`).toBe(true);
    }
    if (new URL(href).pathname.endsWith(".md")) continue;
    await expect(page.locator("main")).toBeVisible();

    const fragment = decodeURIComponent(new URL(href).hash.slice(1));
    if (fragment) {
      const targetExists = await page.evaluate(
        (id) => document.getElementById(id) !== null,
        fragment,
      );
      expect(targetExists, `${href} should identify a page section`).toBe(true);
    }
  }
});

test("direct Guide and API fragment links reveal their rendered section", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [path, id] of [
    ["/guide/#offline-use", "offline-use"],
    ["/reference/#sensor-model", "sensor-model"],
  ] as const) {
    await page.goto(path);
    await page.locator(`#${id}`).waitFor({ state: "attached" });
    await expect
      .poll(async () => {
        const top = await page
          .locator(`#${id}`)
          .evaluate((element) => element.getBoundingClientRect().top);
        return top >= 60 && top < 90;
      })
      .toBe(true);
  }
});

test("course pages keep the complete navigation visible without header collisions", async ({
  page,
}) => {
  const coursePages = [
    ["/", "Home"],
    ["/ide/", "IDE"],
    ["/monitor/", "Monitor"],
    ["/guide/", "Guide"],
    ["/reference/", "API"],
    ["/commission/", "Set up or Repair"],
    ["/author/", null],
    ["/overview/", null],
  ] as const;
  const labels = ["Home", "IDE", "Monitor", "Guide", "Set up or Repair", "API"];

  for (const width of [700, 640, 600, 375]) {
    await page.setViewportSize({ width, height: 850 });
    for (const [entryPage, activeLabel] of coursePages) {
      await page.goto(entryPage);
      const header = page.locator(".app-header").first();
      await expect(header).toBeVisible();
      await expect(header.locator(".brand")).toHaveText("UCSBXRP");
      for (const label of labels) {
        await expect(
          header.getByRole("link", { name: label, exact: true }),
        ).toBeVisible();
      }
      if (activeLabel) {
        await expect(
          header.getByRole("link", { name: activeLabel, exact: true }),
        ).toHaveAttribute("aria-current", "page");
      } else {
        await expect(header.locator('[aria-current="page"]')).toHaveCount(0);
      }

      const boxes = await header.locator(":scope > *").evaluateAll((elements) =>
        elements
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              name:
                element.getAttribute("aria-label") ??
                element.textContent?.trim().slice(0, 40) ??
                element.tagName,
              left: rect.left,
              right: rect.right,
              top: rect.top,
              bottom: rect.bottom,
            };
          })
          .filter((box) => box.right > box.left && box.bottom > box.top),
      );
      const headerBox = await header.boundingBox();
      expect(headerBox).not.toBeNull();
      for (const box of boxes) {
        expect(
          box.left >= headerBox!.x - 0.5 &&
            box.right <= headerBox!.x + headerBox!.width + 0.5 &&
            box.top >= headerBox!.y - 0.5 &&
            box.bottom <= headerBox!.y + headerBox!.height + 0.5,
          `${entryPage} at ${width}px: ${box.name} escapes the header`,
        ).toBe(true);
      }
      for (let first = 0; first < boxes.length; first += 1) {
        for (let second = first + 1; second < boxes.length; second += 1) {
          const a = boxes[first]!;
          const b = boxes[second]!;
          const overlapWidth =
            Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const overlapHeight =
            Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          expect(
            overlapWidth <= 0.5 || overlapHeight <= 0.5,
            `${entryPage} at ${width}px: ${a.name} overlaps ${b.name}`,
          ).toBe(true);
        }
      }
    }
  }
});

test("course pages use consistent browser-tab titles", async ({ page }) => {
  for (const [entryPage, title] of [
    ["/", "UCSBXRP Course Tools"],
    ["/ide/", "UCSBXRP IDE"],
    ["/monitor/", "UCSBXRP Monitor"],
    ["/guide/", "UCSBXRP Guide"],
    ["/commission/", "UCSBXRP Setup or Repair"],
    ["/reference/", "UCSBXRP API Reference"],
    ["/author/", "UCSBXRP Challenge Creation"],
    ["/overview/", "UCSBXRP Technical Overview"],
  ] as const) {
    await page.goto(entryPage);
    await expect(page).toHaveTitle(title);
  }
});

test("IDE and Monitor title bars use navigation rather than duplicate page names", async ({
  page,
}) => {
  for (const [path, active] of [
    ["/ide/", "IDE"],
    ["/monitor/", "Monitor"],
  ] as const) {
    await page.goto(path);
    await expect(page.locator(".brand").first()).toHaveText("UCSBXRP");
    await expect(page.locator(".brand").first()).toHaveAttribute(
      "aria-label",
      "UCSBXRP",
    );
    await expect(
      page
        .getByRole("navigation", { name: "Course applications" })
        .getByRole("link", { name: active, exact: true }),
    ).toHaveAttribute("aria-current", "page");
  }
});

test("Guide presents the course workflow in explicit objective sections", async ({
  page,
}) => {
  await page.goto("/guide/");
  await expect(page.getByRole("heading", { name: "Guide" })).toBeVisible();
  await expect(page.locator(".brand").first()).toHaveText("UCSBXRP");
  await expect(
    page.getByRole("heading", { name: "IDE controls" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Python project structure",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Implement and test components" }),
  ).toBeVisible();
  await expect(
    page.getByText("Do not add sleep_ms() to a loop that calls Robot.step().", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator("#projects")).toContainText("Challenges");
  await expect(page.locator("#projects")).toContainText("Demos");
  await expect(page.locator("#projects")).toContainText("Tutorial");
  await expect(
    page.locator("#project-structure .course-diagram"),
  ).toContainText("wheel-speed feedback");
  await expect(
    page.locator("#project-structure .course-diagram img"),
  ).toHaveAttribute("src", "../diagrams/control-cycle.svg");
  await expect(page.locator("#project-structure svg")).toHaveCount(0);
  await expect(page.locator("#virtual-run")).toContainText(
    "sends the current project over the selected Wi-Fi connection",
  );
  await expect(page.locator("#virtual-run")).toContainText(
    "the Wi-Fi connection remains available for the next Run",
  );
  await expect(page.locator("#physical-xrp")).toContainText(
    "installs or repairs the UCSBXRP software",
  );
  await expect(page.locator("#technical-overview")).not.toContainText(
    "Project storage on the XRP",
  );
  await expect(page.locator("#offline-use")).toContainText(
    "Chrome can load the saved IDE, Monitor, virtual XRP, Guide, API reference, and setup page",
  );
  await expect(page.locator("#offline-use")).toContainText(
    "Project files are ordinary files in that folder; Chrome does not store the course app there",
  );
  await expect(page.locator("#github")).toContainText(
    "Use the cloned repository as the UCSBXRP Working folder",
  );
  await expect(page.locator("#projects")).toContainText(
    "Continue to Challenge",
  );
  await expect(page.locator("#monitor")).toContainText(
    "Runs started in either app write program output and target events to the IDE terminal",
  );
});

test("API class entries contain signatures, parameters, defaults, returns, exceptions, and examples", async ({
  page,
}) => {
  await page.goto("/reference/#sensor-model");
  await expect(
    page.getByRole("heading", { name: "API reference" }),
  ).toBeVisible();
  await expect(page.locator(".brand").first()).toHaveText("UCSBXRP");
  const section = page.locator("#sensor-model");
  await expect(section).toContainText("Base class SensorModelBase");
  await expect(section).toContainText("class SensorModel(SensorModelBase):");
  await expect(
    section.getByRole("heading", { name: "update()" }),
  ).toBeVisible();
  await expect(
    section.getByText("Parameters", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    section.getByText("Return value", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    section.getByText("Exceptions", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    section.getByRole("heading", { name: "SensorModel example" }),
  ).toBeVisible();
  await expect(section).toContainText("left speed (mm/s)");

  await page.goto("/reference/#wheel-speed-controller");
  await expect(page.locator("#wheel-speed-controller")).toContainText(
    "requested left and right wheel speeds from DifferentialDrive",
  );
  await expect(page.locator("#wheel-speed-controller")).toContainText(
    "measured wheel-speed estimates from SensorModel",
  );

  await page.goto("/reference/#grid-planner");
  const gridPlanner = page.locator("#grid-planner");
  await expect(gridPlanner).toContainText(
    "Find a valid connected route from the start cell to the goal cell.",
  );
  await expect(gridPlanner).toContainText(
    "A minimum-length route is not required",
  );
  await expect(gridPlanner).not.toContainText("Find a minimum-length route");

  await page.goto("/reference/#configuration");
  const configuration = page.locator("#configuration");
  await expect(
    configuration.getByText("Default", { exact: true }).first(),
  ).toBeVisible();
  await expect(configuration).toContainText(
    "wheel_speed_filter_time_constant_ms",
  );
  await expect(configuration).toContainText("80.0");

  await page.goto("/reference/#robot");
  const robot = page.locator("#robot");
  await expect(robot).toContainText("Information retained between calls:");
  await expect(robot).toContainText("the next absolute sample deadline");

  await page.goto("/reference/#missions");
  const missions = page.locator("#missions");
  await expect(missions).toContainText(
    "the starting mean wheel position, requested distance, and completion state",
  );
  await expect(missions).toContainText(
    "result is None before and during run()",
  );

  await page.goto("/reference/#xrpbot");
  const xrpbot = page.locator("#xrpbot");
  await expect(xrpbot).toContainText(
    "sensor reads and motor commands used by Robot",
  );
  await expect(xrpbot).toContainText(
    "Encoder positions and motor output belong to those devices",
  );

  await page.goto("/reference/#maps");
  const occupancyGrid = page
    .locator("#maps .class-reference")
    .filter({ has: page.getByRole("heading", { name: "OccupancyGrid" }) });
  await expect(
    occupancyGrid.getByRole("heading", {
      name: "OccupancyGrid.from_arena()",
    }),
  ).toBeVisible();
  await expect(occupancyGrid).toContainText("clearance_mm");
  await expect(occupancyGrid).toContainText("0.0");
  await expect(occupancyGrid).toContainText("OccupancyGrid");
  await expect(occupancyGrid).toContainText(
    "ValueError if resolution_mm is not positive",
  );

  await page.goto("/reference/#missions");
  const deliveryMission = page
    .locator("#missions .class-reference")
    .filter({ has: page.getByRole("heading", { name: "DeliveryMission" }) });
  await expect(
    deliveryMission.getByRole("heading", { name: "run()" }),
  ).toBeVisible();
  await expect(deliveryMission).toContainText("RobotState");
  await expect(deliveryMission).toContainText("robot.stop() is attempted");
  await expect(
    page.getByRole("heading", { name: "Run the supplied delivery sequence" }),
  ).toBeVisible();
});

test("API symbols provide stable contextual anchors and current runnable examples", async ({
  page,
}) => {
  await page.goto("/reference/#method-sensor-model-update");

  await expect(page.locator("#method-sensor-model-update")).toContainText(
    "SensorModel.update(raw: RawSensors) -> Measurements",
  );
  await expect(page.locator("#record-raw-sensors")).toContainText(
    "Stores one direct hardware sample",
  );
  await expect(page.locator("#class-live-parameter")).toContainText(
    "Value currently applied to the program",
  );
  await expect(page.locator("#class-live-parameter")).toContainText("options");
  await expect(page.locator("#function-live-number")).toContainText(
    "Inclusive lower bound",
  );

  const gridPathMethod = page.locator("#method-grid-path-to-goals");
  await expect(gridPathMethod).toContainText("GridPath.to_goals");
  await expect(gridPathMethod).not.toContainText(
    "TypeError if grid is not OccupancyGrid",
  );

  const liveExample = page
    .locator("#live .code-example")
    .filter({ hasText: "wheel_speed_error_mm_s" });
  await expect(liveExample).toContainText("target_speed_mm_s = 120.0");
  await expect(liveExample).toContainText("measured_speed_mm_s = 105.0");

  const worldExample = page
    .locator("#worlds .code-example")
    .filter({ hasText: "Challenge 5" });
  await expect(worldExample).toContainText('blocked_features=("center_gate",)');
  await expect(worldExample).toContainText('world.waypoint("destination")');

  const combinedNames = await page
    .locator(".parameter-row > code:first-child")
    .evaluateAll((cells) =>
      cells
        .map((cell) => cell.textContent ?? "")
        .filter((name) => name.includes(",")),
    );
  expect(combinedNames).toEqual([]);

  const duplicateIds = await page.locator("[id]").evaluateAll((elements) => {
    const counts = new Map<string, number>();
    for (const element of elements) {
      counts.set(element.id, (counts.get(element.id) ?? 0) + 1);
    }
    return [...counts.entries()]
      .filter(([, count]) => count > 1)
      .map(([id]) => id);
  });
  expect(duplicateIds).toEqual([]);
});

test("API sections remain readable without page clipping at phone width", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 760 });
  await page.goto("/reference/#sensor-model");

  const navigation = page.locator(".reference-toc");
  await expect(navigation).toBeVisible();
  const geometry = await navigation.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
    links: [...element.querySelectorAll("a")].map((link) => {
      const bounds = link.getBoundingClientRect();
      return { left: bounds.left, right: bounds.right };
    }),
  }));
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
  expect(
    geometry.links.every((bounds) => bounds.left >= 0 && bounds.right <= 375),
  ).toBe(true);

  const pageGeometry = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(pageGeometry.scrollWidth).toBeLessThanOrEqual(
    pageGeometry.clientWidth + 1,
  );

  const parameterRows = page.locator("#sensor-model .parameter-row");
  await expect(parameterRows.first()).toBeVisible();
  const rowsFit = await parameterRows.evaluateAll((rows) =>
    rows.every((row) => row.scrollWidth <= row.clientWidth + 1),
  );
  expect(rowsFit).toBe(true);

  const signatureFontSize = await page
    .locator("#sensor-model .method-signature")
    .first()
    .evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize),
    );
  expect(signatureFontSize).toBeGreaterThanOrEqual(10.5);
  expect(signatureFontSize).toBeLessThanOrEqual(12);
  const exampleFontSize = await page
    .locator("#sensor-model .code-example pre code")
    .first()
    .evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize),
    );
  expect(exampleFontSize).toBeGreaterThanOrEqual(10.5);
  expect(exampleFontSize).toBeLessThanOrEqual(12);
});

test("Guide remains usable without horizontal page scrolling at phone width", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 760 });
  await page.goto("/guide/");
  await expect(page.getByRole("heading", { name: "Guide" })).toBeVisible();
  const geometry = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
  const bodyFontSize = await page
    .locator(".guide-content > section:not(.guide-intro) p")
    .first()
    .evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize),
    );
  expect(bodyFontSize).toBeGreaterThanOrEqual(11.5);
  expect(bodyFontSize).toBeLessThanOrEqual(12.5);
  const inlineCodeFontSize = await page
    .locator(".guide-content code")
    .first()
    .evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize),
    );
  expect(inlineCodeFontSize).toBeGreaterThanOrEqual(10.5);
  expect(inlineCodeFontSize).toBeLessThanOrEqual(bodyFontSize);

  const flowsFit = await page
    .locator(".course-flow")
    .evaluateAll((flows) =>
      flows.every((flow) => flow.scrollWidth <= flow.clientWidth + 1),
    );
  expect(flowsFit).toBe(true);
});

test("Instructor reference remains readable at phone width", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 760 });
  await page.goto("/overview/");
  await expect(
    page.getByRole("heading", {
      name: "UCSBXRP technical overview",
    }),
  ).toBeVisible();
  const geometry = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
  const codeFontSize = await page
    .locator(".overview-flow")
    .first()
    .evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize),
    );
  expect(codeFontSize).toBeGreaterThanOrEqual(14);
});
