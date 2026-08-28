import { expect, test } from "@playwright/test";

import { readWorkspaceManifest, seedWorkingFolder } from "./working-folder";

test("duplicate IDE tabs keep the same saved Project and do not block Monitor", async ({
  context,
  page: firstIde,
}) => {
  await seedWorkingFolder(firstIde, { folderName: "Shared-Project-Work" });
  await firstIde.goto("/ide/");
  await expect(firstIde.getByTestId("project-name")).toHaveText(
    "Expanding spiral",
  );
  await expect(firstIde.getByTestId("project-folder")).toHaveText(
    "Expanding-Spiral",
  );

  const secondIde = await context.newPage();
  await secondIde.goto("/ide/");
  await expect(secondIde.getByTestId("project-name")).toHaveText(
    "Expanding spiral",
  );
  await expect(secondIde.getByTestId("project-folder")).toHaveText(
    "Expanding-Spiral",
  );

  const monitor = await context.newPage();
  await monitor.goto("/monitor/");
  const run = monitor.getByRole("button", { name: "Run", exact: true });
  await expect(run).toBeEnabled();
  await expect(run).toHaveAttribute("title", /Expanding spiral/);
  expect(
    await readWorkspaceManifest<{ activeProject: string }>(
      monitor,
      "Shared-Project-Work",
    ),
  ).toMatchObject({ activeProject: "Expanding-Spiral" });

  await firstIde.close();
  await run.click();
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Virtual XRP · running",
  );
  await monitor.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await expect(secondIde.getByTestId("project-name")).toHaveText(
    "Expanding spiral",
  );
});
