import { describe, expect, it } from "vitest";

import { RunOwnerLease } from "./run-owner-lease";

describe("virtual run-owner lease", () => {
  it("expires unless the owning run renews it", () => {
    const lease = new RunOwnerLease<object>(1_500);
    const owner = {};
    lease.begin(owner, 7, 100);

    expect(lease.expired(1_599)).toBe(false);
    expect(lease.heartbeat(owner, 7, 1_000)).toBe(true);
    expect(lease.expired(2_499)).toBe(false);
    expect(lease.expired(2_500)).toBe(true);
  });

  it("rejects stale runs and other owners", () => {
    const lease = new RunOwnerLease<object>(1_000);
    const owner = {};
    const other = {};
    lease.begin(owner, 3, 0);

    expect(lease.heartbeat(other, 3, 100)).toBe(false);
    expect(lease.heartbeat(owner, 2, 100)).toBe(false);
    expect(lease.owns(owner, 3)).toBe(true);
    expect(lease.ownsPort(other)).toBe(false);
  });

  it("cannot expire after it is cleared", () => {
    const lease = new RunOwnerLease<object>(100);
    const owner = {};
    lease.begin(owner, 1, 0);
    lease.clear();
    expect(lease.expired(10_000)).toBe(false);
    expect(lease.ownsPort(owner)).toBe(false);
  });
});
