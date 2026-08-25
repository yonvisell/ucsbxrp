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
