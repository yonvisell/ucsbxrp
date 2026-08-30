/// <reference lib="webworker" />

import {
  DirectPhysicalTargetClient,
  PHYSICAL_POLL_COORDINATOR_GENERATION,
} from "./physical-target";
import { PhysicalTargetCoordinator } from "./physical-target-coordinator";
import type { PhysicalWorkerCommand } from "./physical-worker-protocol";

declare const self: SharedWorkerGlobalScope;

const pollOwnerId = `worker-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

const coordinator = new PhysicalTargetCoordinator(
  (endpoint, discoveryTimeoutMs, expectedRobotId) =>
    new DirectPhysicalTargetClient(endpoint, {
      discoveryTimeoutMs,
      expectedRobotId,
      pollCoordinatorGeneration: PHYSICAL_POLL_COORDINATOR_GENERATION,
      pollOwnerId,
      // A SharedWorker has no reliable notification when a document vanishes.
      // Only visible app frames may advance its polling clock, so an orphaned
      // worker cannot renew the XRP's single-poller lease indefinitely.
      pollDrivenByVisibleClient: true,
    }),
);

self.onconnect = (event: MessageEvent) => {
  const port = event.ports[0];
  if (!port) {
    return;
  }
  coordinator.attach(port);
  port.onmessage = (message: MessageEvent<PhysicalWorkerCommand>) => {
    coordinator.handle(port, message.data);
  };
  port.start();
};

export {};
