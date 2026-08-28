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
    page.getByRole("heading", { name: "Implement and test a component" }),
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

test("API catalog renders coherent component requirements and linked types", async ({
  page,
}) => {
  await page.goto("/reference/#sensor-model");
  await expect(
    page.getByRole("heading", { name: "API reference" }),
  ).toBeVisible();
  await expect(page.locator(".brand").first()).toHaveText("UCSBXRP");
  const section = page.locator("#sensor-model");
  await expect(section).toContainText("Base class SensorModelBase");
  await expect(section).toContainText("class SensorModel(SensorModelBase)");
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
  await expect(section).toContainText(
    "Total wheel positions are calculated relative to the reset origins",
  );
  await expect(
    section.locator('a[href="#record-raw-sensors"]').first(),
  ).toHaveText("RawSensors");
  await expect(
    section.locator('a[href="#class-robot-config"]').first(),
  ).toHaveText("RobotConfig");

  await page.goto("/reference/#wheel-speed-controller");
  await expect(page.locator("#wheel-speed-controller")).toContainText(
    "larger speed error in the requested direction",
  );

  await page.goto("/reference/#odometry");
  await expect(page.locator("#odometry")).toContainText(
    "exact constant-curvature arc",
  );

  await page.goto("/reference/#navigation-controller");
  await expect(page.locator("#navigation-controller")).toContainText(
    "Turn toward a goal before driving forward",
  );

  await page.goto("/reference/#grid-planner");
  const gridPlanner = page.locator("#grid-planner");
  await expect(gridPlanner).toContainText(
    "Find a valid connected route from the start cell to the goal cell.",
  );
  await expect(gridPlanner).toContainText(
    "Any route that connects the endpoints through free edge-adjacent cells is accepted",
  );
  await expect(gridPlanner).not.toContainText(
    "minimum-length route is not required",
  );

  await page.goto("/reference/#configuration");
  const configuration = page.locator("#configuration");
  await expect(
    configuration.getByText("Default", { exact: true }).first(),
  ).toBeVisible();
  await expect(configuration).toContainText(
    "wheel_speed_filter_time_constant_ms",
  );
  await expect(configuration).toContainText("80.0");
});

test("API catalog provides stable unique anchors for contextual navigation", async ({
  page,
}) => {
  await page.goto("/reference/#method-sensor-model-update");

  await expect(page.locator("#method-sensor-model-update")).toContainText(
    "update(raw: RawSensors) -> Measurements",
  );
  await expect(page.locator("#record-raw-sensors")).toContainText(
    "Store one direct hardware sample",
  );
  await expect(page.locator("#class-live-parameter")).toContainText(
    "value currently applied to the program",
  );
  await expect(page.locator("#class-live-parameter")).toContainText("options");
  await expect(page.locator("#function-live-number")).toContainText(
    "range does not need to contain an exact whole number of steps",
  );

  const gridPathMethod = page.locator("#method-grid-path-to-goals");
  await expect(gridPathMethod).toContainText("to_goals(grid: OccupancyGrid");
  await expect(
    gridPathMethod.locator('a[href="#class-occupancy-grid"]'),
  ).toHaveText("OccupancyGrid");

  await expect(page.locator("#records")).toHaveCount(1);
  await expect(page.locator("#maps")).toHaveCount(1);
  await expect(page.locator("#missions")).toHaveCount(1);

  const linkedTypeTargets = await page
    .locator(".type-expression a")
    .evaluateAll((links) =>
      links.map((link) => link.getAttribute("href") ?? ""),
    );
  for (const target of new Set(linkedTypeTargets)) {
    expect(target.startsWith("#")).toBe(true);
    await expect(page.locator(target)).toHaveCount(1);
  }

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
