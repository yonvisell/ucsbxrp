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
        links.map((link) => (link as HTMLAnchorElement).href),
      )) {
      const target = new URL(href);
      if (target.origin === origin) internalLinks.add(target.toString());
    }
  }

  for (const href of internalLinks) {
    const response = await page.goto(href);
    if (response) {
      expect(response.ok(), `${href} should load`).toBe(true);
    }
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

test("API sections remain fully visible rather than clipping at phone width", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 760 });
  await page.goto("/reference/");

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
});
