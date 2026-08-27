import { expect, test } from "@playwright/test";

const entryPages = [
  "/",
  "/ide/",
  "/monitor/",
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

test("student pages keep the complete course navigation visible without header collisions", async ({
  page,
}) => {
  const studentPages = [
    "/",
    "/ide/",
    "/monitor/",
    "/guide/",
    "/reference/",
    "/commission/",
  ];
  const labels = ["Home", "IDE", "Monitor", "Guide", "Set up or Repair", "API"];

  for (const width of [700, 560]) {
    await page.setViewportSize({ width, height: 850 });
    for (const entryPage of studentPages) {
      await page.goto(entryPage);
      const header = page.locator(".app-header").first();
      await expect(header).toBeVisible();
      for (const label of labels) {
        await expect(
          header.getByRole("link", { name: label, exact: true }),
        ).toBeVisible();
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
  await expect(
    page.getByRole("heading", { name: "UCSBXRP guide" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "IDE controls" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Project files, units, and data flow",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Implement and test components" }),
  ).toBeVisible();
});

test("API class entries contain signatures, parameters, defaults, returns, exceptions, and examples", async ({
  page,
}) => {
  await page.goto("/reference/#sensor-model");
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
    section.getByRole("heading", { name: "SensorModel call example" }),
  ).toBeVisible();

  await page.goto("/reference/#configuration");
  const configuration = page.locator("#configuration");
  await expect(
    configuration.getByText("Default", { exact: true }).first(),
  ).toBeVisible();
  await expect(configuration).toContainText(
    "wheel_speed_filter_time_constant_ms",
  );
  await expect(configuration).toContainText("80.0");

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
  expect(signatureFontSize).toBeGreaterThanOrEqual(14);
  const exampleFontSize = await page
    .locator("#sensor-model .code-example pre code")
    .first()
    .evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize),
    );
  expect(exampleFontSize).toBeGreaterThanOrEqual(14);
});

test("Guide remains usable without horizontal page scrolling at phone width", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 760 });
  await page.goto("/guide/");
  await expect(
    page.getByRole("heading", { name: "UCSBXRP guide" }),
  ).toBeVisible();
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
  expect(bodyFontSize).toBeGreaterThanOrEqual(14);
  const inlineCodeFontSize = await page
    .locator(".guide-content code")
    .first()
    .evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize),
    );
  expect(inlineCodeFontSize).toBeGreaterThanOrEqual(12);
  expect(inlineCodeFontSize).toBeLessThanOrEqual(bodyFontSize);
});

test("Instructor reference remains readable at phone width", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 760 });
  await page.goto("/overview/");
  await expect(
    page.getByRole("heading", {
      name: "UCSBXRP instructor system reference",
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
