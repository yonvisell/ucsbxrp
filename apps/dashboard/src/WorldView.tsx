import { useEffect, useRef } from "react";
import * as THREE from "three";

import {
  SIMULATION_SCENARIOS,
  type SimulationScenario,
  type TelemetrySample,
} from "@ucsb-xrp/target";

interface WorldViewProps {
  sample: TelemetrySample;
  scenario: SimulationScenario | null;
}

export function WorldView({ sample, scenario }: WorldViewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const robotRef = useRef<THREE.Group | null>(null);
  const trailRef = useRef<THREE.Line | null>(null);
  const rangeRef = useRef<THREE.Line | null>(null);
  const trailPoints = useRef<THREE.Vector3[]>([]);
  const lastSequence = useRef(-1);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#f5f7f8");
    const camera = new THREE.OrthographicCamera(
      -1200,
      1200,
      900,
      -900,
      1,
      4000,
    );
    camera.position.set(0, -40, 2200);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    host.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight("#ffffff", 1.8);
    scene.add(ambient);
    const key = new THREE.DirectionalLight("#ffffff", 2.2);
    key.position.set(-300, -250, 700);
    scene.add(key);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(2400, 1800),
      new THREE.MeshStandardMaterial({
        color: "#edf0f1",
        roughness: 0.92,
        metalness: 0,
      }),
    );
    floor.position.z = -12;
    scene.add(floor);

    const grid = new THREE.GridHelper(2400, 24, "#98a6ae", "#d4dadd");
    grid.rotation.x = Math.PI / 2;
    grid.position.z = -10;
    scene.add(grid);

    const borderGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1200, -900, -8),
      new THREE.Vector3(1200, -900, -8),
      new THREE.Vector3(1200, 900, -8),
      new THREE.Vector3(-1200, 900, -8),
    ]);
    const border = new THREE.LineLoop(
      borderGeometry,
      new THREE.LineBasicMaterial({ color: "#6f7e86" }),
    );
    scene.add(border);

    const obstacles = scenario ? SIMULATION_SCENARIOS[scenario].obstacles : [];
    for (const obstacle of obstacles) {
      const width = obstacle.maximumXmm - obstacle.minimumXmm;
      const height = obstacle.maximumYmm - obstacle.minimumYmm;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, 26),
        new THREE.MeshStandardMaterial({
          color: "#bd544d",
          roughness: 0.72,
          metalness: 0,
        }),
      );
      mesh.position.set(
        (obstacle.minimumXmm + obstacle.maximumXmm) / 2,
        (obstacle.minimumYmm + obstacle.maximumYmm) / 2,
        1,
      );
      scene.add(mesh);
    }

    const robot = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(170, 112, 30),
      new THREE.MeshStandardMaterial({
        color: "#f7f8f9",
        roughness: 0.5,
        metalness: 0.08,
      }),
    );
    body.position.z = 14;
    robot.add(body);

    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(95, 76, 18),
      new THREE.MeshStandardMaterial({ color: "#08736b", roughness: 0.48 }),
    );
    deck.position.set(-12, 0, 38);
    robot.add(deck);

    const wheelMaterial = new THREE.MeshStandardMaterial({
      color: "#20262a",
      roughness: 0.8,
    });
    for (const side of [-1, 1]) {
      const wheel = new THREE.Mesh(
        new THREE.BoxGeometry(72, 16, 34),
        wheelMaterial,
      );
      wheel.position.set(-4, side * 66, 8);
      robot.add(wheel);
    }

    const heading = new THREE.Mesh(
      new THREE.ConeGeometry(15, 38, 3),
      new THREE.MeshBasicMaterial({ color: "#9b6500" }),
    );
    heading.rotation.z = -Math.PI / 2;
    heading.position.set(102, 0, 20);
    robot.add(heading);
    scene.add(robot);
    robotRef.current = robot;

    const trail = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: "#08736b" }),
    );
    trail.position.z = 1;
    scene.add(trail);
    trailRef.current = trail;

    const range = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: "#a66b08" }),
    );
    range.position.z = 3;
    scene.add(range);
    rangeRef.current = range;

    const resize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      const vertical = 1950;
      const horizontal = vertical * (width / height);
      camera.left = -horizontal / 2;
      camera.right = horizontal / 2;
      camera.top = vertical / 2;
      camera.bottom = -vertical / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      renderer.render(scene, camera);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    let animationFrame = 0;
    const render = () => {
      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      renderer.dispose();
      borderGeometry.dispose();
      host.removeChild(renderer.domElement);
      robotRef.current = null;
      trailRef.current = null;
      range.geometry.dispose();
      rangeRef.current = null;
      trailPoints.current = [];
      lastSequence.current = -1;
    };
  }, [scenario]);

  useEffect(() => {
    const robot = robotRef.current;
    const trail = trailRef.current;
    const range = rangeRef.current;
    if (!robot || !trail || !range || sample.seq === lastSequence.current) {
      return;
    }
    if (sample.seq === 0 && lastSequence.current > 0) {
      trailPoints.current = [];
    }
    lastSequence.current = sample.seq;
    robot.position.set(sample.xMm, sample.yMm, 0);
    robot.rotation.z = sample.headingRad;
    trailPoints.current.push(new THREE.Vector3(sample.xMm, sample.yMm, 1));
    if (trailPoints.current.length > 1200) {
      trailPoints.current.shift();
    }
    trail.geometry.dispose();
    trail.geometry = new THREE.BufferGeometry().setFromPoints(
      trailPoints.current,
    );
    range.geometry.dispose();
    if (sample.rangeMm === null) {
      range.visible = false;
    } else {
      range.visible = true;
      const sensorX = sample.xMm + 70 * Math.cos(sample.headingRad);
      const sensorY = sample.yMm + 70 * Math.sin(sample.headingRad);
      range.geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(sensorX, sensorY, 3),
        new THREE.Vector3(
          sensorX + sample.rangeMm * Math.cos(sample.headingRad),
          sensorY + sample.rangeMm * Math.sin(sample.headingRad),
          3,
        ),
      ]);
    }
  }, [sample]);

  return (
    <div
      aria-label="Top-down virtual XRP world"
      className="world-view"
      data-testid="world-view"
      ref={hostRef}
    >
      <div className={`world-overlay ${sample.collision ? "collision" : ""}`}>
        {scenario ? <span>{SIMULATION_SCENARIOS[scenario].label}</span> : null}
        <span>
          range{" "}
          {sample.rangeMm === null ? "—" : `${sample.rangeMm.toFixed(0)} mm`}
        </span>
        {sample.collision ? <strong>collision</strong> : null}
      </div>
    </div>
  );
}
