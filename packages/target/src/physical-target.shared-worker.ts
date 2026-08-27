/// <reference lib="webworker" />

import { DirectPhysicalTargetClient } from "./physical-target";
import { PhysicalTargetCoordinator } from "./physical-target-coordinator";
import type { PhysicalWorkerCommand } from "./physical-worker-protocol";

declare const self: SharedWorkerGlobalScope;

const coordinator = new PhysicalTargetCoordinator(
  (endpoint, discoveryTimeoutMs, expectedRobotId) =>
    new DirectPhysicalTargetClient(endpoint, {
      discoveryTimeoutMs,
      expectedRobotId,
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
