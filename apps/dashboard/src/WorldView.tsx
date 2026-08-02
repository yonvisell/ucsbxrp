import { useEffect, useRef, useState } from "react";
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

const WORLD_VERTICAL_SPAN_MM = 1_950;
const WORLD_RULER_MM = 500;
// Official Open-STEM V1.3 chassis mesh bounds and SparkFun controller drawing;
// wheel geometry remains the measured course configuration.
const XRP_CHASSIS_LENGTH_MM = 192.5;
const XRP_CHASSIS_WIDTH_MM = 190.5;
const XRP_CONTROLLER_LENGTH_MM = 63.5;
const XRP_CONTROLLER_WIDTH_MM = 54;
const XRP_TRACK_WIDTH_MM = 155;
const XRP_WHEEL_DIAMETER_MM = 60;

export function WorldView({ sample, scenario }: WorldViewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const robotRef = useRef<THREE.Group | null>(null);
  const trailRef = useRef<THREE.Line | null>(null);
  const rangeRef = useRef<THREE.Line | null>(null);
  const trailPoints = useRef<THREE.Vector3[]>([]);
  const lastSequence = useRef(-1);
  const [rulerWidthPx, setRulerWidthPx] = useState(80);
  const [viewZoom, setViewZoom] = useState<1 | 3>(1);

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
    camera.position.set(sample.xMm, sample.yMm - 40, 2200);
    camera.lookAt(sample.xMm, sample.yMm, 0);
    cameraRef.current = camera;

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
    const chassisMaterial = new THREE.MeshStandardMaterial({
      color: "#aeb5b9",
      roughness: 0.82,
      metalness: 0,
    });
    const crossMemberMaterial = new THREE.MeshStandardMaterial({
      color: "#858e93",
      roughness: 0.8,
      metalness: 0,
    });
    for (const side of [-1, 1]) {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(XRP_CHASSIS_LENGTH_MM, 18, 18),
        chassisMaterial,
      );
      rail.position.set(0, side * (XRP_CHASSIS_WIDTH_MM / 2 - 9), 11);
      robot.add(rail);
    }
    for (const x of [-87, 20]) {
      const crossMember = new THREE.Mesh(
        new THREE.BoxGeometry(18, XRP_CHASSIS_WIDTH_MM - 18, 18),
        crossMemberMaterial,
      );
      crossMember.position.set(x, 0, 11);
      robot.add(crossMember);
    }

    const wheelMaterial = new THREE.MeshStandardMaterial({
      color: "#20262a",
      roughness: 0.8,
    });
    for (const side of [-1, 1]) {
      const wheel = new THREE.Mesh(
        new THREE.BoxGeometry(XRP_WHEEL_DIAMETER_MM, 17, 30),
        wheelMaterial,
      );
      wheel.position.set(-37, side * (XRP_TRACK_WIDTH_MM / 2), 18);
      robot.add(wheel);

      const casterPod = new THREE.Mesh(
        new THREE.CylinderGeometry(16, 16, 20, 28),
        chassisMaterial,
      );
      casterPod.rotation.x = Math.PI / 2;
      casterPod.position.set(76, side * 73, 14);
      robot.add(casterPod);
    }

    const battery = new THREE.Mesh(
      new THREE.BoxGeometry(56, 56, 18),
      new THREE.MeshStandardMaterial({ color: "#333a3e", roughness: 0.76 }),
    );
    battery.position.set(-52, 0, 28);
    robot.add(battery);

    const controller = new THREE.Mesh(
      new THREE.BoxGeometry(
        XRP_CONTROLLER_LENGTH_MM,
        XRP_CONTROLLER_WIDTH_MM,
        5,
      ),
      new THREE.MeshStandardMaterial({ color: "#b83b35", roughness: 0.6 }),
    );
    controller.position.set(2, 0, 32);
    robot.add(controller);

    const electronicsMaterial = new THREE.MeshStandardMaterial({
      color: "#242a2e",
      roughness: 0.62,
    });
    for (const side of [-1, 1]) {
      const header = new THREE.Mesh(
        new THREE.BoxGeometry(54, 5, 6),
        electronicsMaterial,
      );
      header.position.set(2, side * 18, 37);
      robot.add(header);
    }
    const processor = new THREE.Mesh(
      new THREE.BoxGeometry(18, 16, 5),
      electronicsMaterial,
    );
    processor.position.set(7, 0, 37);
    robot.add(processor);

    const rangeBoard = new THREE.Mesh(
      new THREE.BoxGeometry(9, 37, 5),
      new THREE.MeshStandardMaterial({ color: "#b83b35", roughness: 0.65 }),
    );
    rangeBoard.position.set(91, 0, 29);
    robot.add(rangeBoard);
    for (const side of [-1, 1]) {
      const transducer = new THREE.Mesh(
        new THREE.CylinderGeometry(7, 7, 5, 24),
        new THREE.MeshStandardMaterial({ color: "#d8dde0", roughness: 0.5 }),
      );
      transducer.rotation.x = Math.PI / 2;
      transducer.position.set(95, side * 10, 31);
      robot.add(transducer);
    }

    const heading = new THREE.Mesh(
      new THREE.ConeGeometry(5, 16, 3),
      new THREE.MeshBasicMaterial({ color: "#27333b" }),
    );
    heading.rotation.z = -Math.PI / 2;
    heading.position.set(108, 0, 12);
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
      const vertical = WORLD_VERTICAL_SPAN_MM / viewZoom;
      const horizontal = vertical * (width / height);
      camera.left = -horizontal / 2;
      camera.right = horizontal / 2;
      camera.top = vertical / 2;
      camera.bottom = -vertical / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      setRulerWidthPx((WORLD_RULER_MM * height) / vertical);
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
      scene.traverse((object) => {
        const disposable = object as THREE.Mesh | THREE.Line;
        disposable.geometry?.dispose();
        const material = disposable.material;
        if (Array.isArray(material)) {
          material.forEach((item) => item.dispose());
        } else {
          material?.dispose();
        }
      });
      renderer.dispose();
      host.removeChild(renderer.domElement);
      cameraRef.current = null;
      robotRef.current = null;
      trailRef.current = null;
      rangeRef.current = null;
      trailPoints.current = [];
      lastSequence.current = -1;
    };
  }, [scenario, viewZoom]);

  useEffect(() => {
    const robot = robotRef.current;
    const camera = cameraRef.current;
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
    if (camera && viewZoom > 1) {
      camera.position.x = sample.xMm;
      camera.position.y = sample.yMm - 40;
      camera.lookAt(sample.xMm, sample.yMm, 0);
    }
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
      const sensorX =
        sample.xMm + (XRP_CHASSIS_LENGTH_MM / 2) * Math.cos(sample.headingRad);
      const sensorY =
        sample.yMm + (XRP_CHASSIS_LENGTH_MM / 2) * Math.sin(sample.headingRad);
      range.geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(sensorX, sensorY, 3),
        new THREE.Vector3(
          sensorX + sample.rangeMm * Math.cos(sample.headingRad),
          sensorY + sample.rangeMm * Math.sin(sample.headingRad),
          3,
        ),
      ]);
    }
  }, [sample, viewZoom]);

  return (
    <div
      aria-label="Top-down virtual XRP world"
      className="world-view"
      data-testid="world-view"
      data-xrp-footprint-mm={`${XRP_CHASSIS_LENGTH_MM} × ${XRP_CHASSIS_WIDTH_MM}`}
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
      <button
        aria-pressed={viewZoom > 1}
        className="world-view-toggle"
        onClick={() => setViewZoom((current) => (current === 1 ? 3 : 1))}
        type="button"
      >
        {viewZoom === 1 ? "Inspect XRP" : "Show arena"}
      </button>
      <div
        aria-label={`${WORLD_RULER_MM} millimeter world ruler`}
        className="world-ruler"
        data-testid="world-ruler"
        style={{ width: `${rulerWidthPx}px` }}
      >
        <div className="world-ruler-line">
          <i />
          <i />
          <i />
        </div>
        <div className="world-ruler-labels">
          <span>0</span>
          <span>250</span>
          <span>500 mm</span>
        </div>
      </div>
      <div aria-hidden="true" className="world-axes">
        +x →&nbsp;&nbsp; +y ↑
      </div>
    </div>
  );
}
