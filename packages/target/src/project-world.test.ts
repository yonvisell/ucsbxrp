import { describe, expect, it } from "vitest";

import { worldCatalogForProject } from "./project-world";

describe("project world", () => {
  it("loads the project-owned default world, obstacles, and markers", () => {
    const catalog = worldCatalogForProject({
      entrypoint: "main.py",
      files: {
        "main.py": "pass\n",
        "world.json": JSON.stringify({
          default_world: "lab",
          worlds: [
            {
              id: "lab",
              label: "Lab",
              bounds: {
                minimum_x_mm: 0,
                minimum_y_mm: 0,
                maximum_x_mm: 800,
                maximum_y_mm: 600,
              },
              initial_pose: { x_mm: 100, y_mm: 120, heading_rad: 0 },
              obstacles: [
                {
                  type: "wall",
                  minimum_x_mm: 300,
                  minimum_y_mm: 0,
                  maximum_x_mm: 330,
                  maximum_y_mm: 400,
                },
              ],
              markers: [
                {
                  type: "waypoint",
                  name: "finish",
                  x_mm: 700,
                  y_mm: 500,
                },
              ],
            },
          ],
        }),
      },
    });

    expect(catalog.defaultWorldId).toBe("lab");
    expect(catalog.worlds[0]?.initialPose).toEqual({
      xMm: 100,
      yMm: 120,
      headingRad: 0,
    });
    expect(catalog.worlds[0]?.obstacles).toHaveLength(1);
    expect(catalog.worlds[0]?.markers[0]).toMatchObject({
      type: "waypoint",
      name: "finish",
    });
  });

  it("rejects malformed geometry before a project runs", () => {
    expect(() =>
      worldCatalogForProject({
        entrypoint: "main.py",
        files: {
          "main.py": "pass\n",
          "world.json": JSON.stringify({
            default_world: "bad",
            worlds: [
              {
                id: "bad",
                label: "Bad",
                bounds: {
                  minimum_x_mm: 10,
                  minimum_y_mm: 0,
                  maximum_x_mm: 10,
                  maximum_y_mm: 100,
                },
              },
            ],
          }),
        },
      }),
    ).toThrow("positive width and height");
  });
});
