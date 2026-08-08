import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import {
  SIMULATION_SCENARIOS,
  type SimulationScenario,
  type TelemetrySample,
} from "@ucsb-xrp/target";

interface WorldViewProps {
  onScenarioChange?: (scenario: SimulationScenario) => void;
  poseLabel: string;
  sample: TelemetrySample;
  scenario: SimulationScenario | null;
  scenarioDisabled?: boolean;
}

const WORLD_WIDTH_MM = 2_400;
const WORLD_HEIGHT_MM = 1_800;
const WORLD_VERTICAL_SPAN_MM = 1_950;
const MINOR_GRID_MM = 100;
const MAJOR_GRID_MM = 500;

// Official Open-STEM V1.3 chassis bounds and SparkFun controller drawing;
// wheel geometry uses the measured course configuration.
const XRP_CHASSIS_LENGTH_MM = 192.5;
const XRP_CHASSIS_WIDTH_MM = 190.5;
const XRP_CONTROLLER_LENGTH_MM = 63.5;
const XRP_CONTROLLER_WIDTH_MM = 54;
const XRP_TRACK_WIDTH_MM = 155;
const XRP_WHEEL_DIAMETER_MM = 60;

function addSegments(
  scene: THREE.Scene,
  points: THREE.Vector3[],
  color: string,
  z: number,
): void {
  const line = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color }),
  );
  line.position.z = z;
  scene.add(line);
}

function textSprite(text: string, widthMm = 176): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("World label canvas is unavailable");
  }
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "650 40px system-ui, sans-serif";
  context.lineWidth = 7;
  context.strokeStyle = "rgba(255, 255, 255, 0.96)";
  context.strokeText(text, canvas.width / 2, canvas.height / 2);
  context.fillStyle = "#34444d";
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      depthTest: false,
      map: texture,
      transparent: true,
    }),
  );
  sprite.scale.set(widthMm, 42, 1);
  sprite.renderOrder = 5;
  return sprite;
}

function addBoundedGrid(scene: THREE.Scene): void {
  const halfWidth = WORLD_WIDTH_MM / 2;
  const halfHeight = WORLD_HEIGHT_MM / 2;
  const minor: THREE.Vector3[] = [];
  const major: THREE.Vector3[] = [];

  for (let x = -halfWidth + MINOR_GRID_MM; x < halfWidth; x += MINOR_GRID_MM) {
    const points = x % MAJOR_GRID_MM === 0 ? major : minor;
    points.push(
      new THREE.Vector3(x, -halfHeight, 0),
      new THREE.Vector3(x, halfHeight, 0),
    );
  }
  for (
    let y = -halfHeight + MINOR_GRID_MM;
    y < halfHeight;
    y += MINOR_GRID_MM
  ) {
    const points = y % MAJOR_GRID_MM === 0 ? major : minor;
    points.push(
      new THREE.Vector3(-halfWidth, y, 0),
      new THREE.Vector3(halfWidth, y, 0),
    );
  }

  addSegments(scene, minor, "#d5dadd", -9);
  addSegments(scene, major, "#aeb8bd", -8);
  addSegments(
    scene,
    [
      new THREE.Vector3(-halfWidth, 0, 0),
      new THREE.Vector3(halfWidth, 0, 0),
      new THREE.Vector3(0, -halfHeight, 0),
      new THREE.Vector3(0, halfHeight, 0),
    ],
    "#687a84",
    -7,
  );

  const border = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-halfWidth, -halfHeight, -6),
      new THREE.Vector3(halfWidth, -halfHeight, -6),
      new THREE.Vector3(halfWidth, halfHeight, -6),
      new THREE.Vector3(-halfWidth, halfHeight, -6),
    ]),
    new THREE.LineBasicMaterial({ color: "#596a73" }),
  );
  scene.add(border);

  for (let x = -1_000; x <= 1_000; x += MAJOR_GRID_MM) {
    const label = textSprite(String(x), 190);
    label.position.set(x, -864, 4);
    scene.add(label);
  }
  for (const y of [-500, 500]) {
    const label = textSprite(String(y), 165);
    label.position.set(-1_105, y, 4);
    scene.add(label);
  }
  const xAxisLabel = textSprite("x (mm)", 160);
  xAxisLabel.position.set(1_105, -816, 4);
  scene.add(xAxisLabel);
  const yAxisLabel = textSprite("y (mm)", 160);
  yAxisLabel.position.set(-1_105, 816, 4);
  scene.add(yAxisLabel);
}

function addRobotModel(scene: THREE.Scene): THREE.Group {
  const robot = new THREE.Group();
  const chassisMaterial = new THREE.MeshStandardMaterial({
    color: "#68747b",
    metalness: 0.05,
    roughness: 0.76,
  });

  for (const side of [-1, 1]) {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(XRP_CHASSIS_LENGTH_MM - 8, 17, 11),
      chassisMaterial,
    );
    rail.position.set(0, side * (XRP_CHASSIS_WIDTH_MM / 2 - 10), 10);
    robot.add(rail);
  }
  for (const x of [-82, 54]) {
    const crossMember = new THREE.Mesh(
      new THREE.BoxGeometry(17, XRP_CHASSIS_WIDTH_MM - 34, 10),
      chassisMaterial,
    );
    crossMember.position.set(x, 0, 9);
    robot.add(crossMember);
  }

  const wheelMaterial = new THREE.MeshStandardMaterial({
    color: "#20262a",
    roughness: 0.9,
  });
  for (const side of [-1, 1]) {
    const wheel = new THREE.Mesh(
      new THREE.BoxGeometry(XRP_WHEEL_DIAMETER_MM, 18, 31),
      wheelMaterial,
    );
    wheel.position.set(-29, side * (XRP_TRACK_WIDTH_MM / 2), 18);
    robot.add(wheel);

    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(10, 10, 19, 24),
      new THREE.MeshStandardMaterial({ color: "#aeb5b9", roughness: 0.68 }),
    );
    hub.rotation.x = Math.PI / 2;
    hub.position.set(-29, side * (XRP_TRACK_WIDTH_MM / 2), 19);
    robot.add(hub);
  }

  const caster = new THREE.Mesh(
    new THREE.SphereGeometry(13, 24, 16),
    new THREE.MeshStandardMaterial({ color: "#66737a", roughness: 0.48 }),
  );
  caster.position.set(76, 0, 11);
  robot.add(caster);

  const battery = new THREE.Mesh(
    new THREE.BoxGeometry(61, 58, 22),
    new THREE.MeshStandardMaterial({ color: "#333a3e", roughness: 0.8 }),
  );
  battery.position.set(-57, 0, 28);
  robot.add(battery);

  const controller = new THREE.Mesh(
    new THREE.BoxGeometry(XRP_CONTROLLER_LENGTH_MM, XRP_CONTROLLER_WIDTH_MM, 6),
    new THREE.MeshStandardMaterial({ color: "#b83b35", roughness: 0.62 }),
  );
  controller.position.set(10, 0, 27);
  robot.add(controller);

  const radio = new THREE.Mesh(
    new THREE.BoxGeometry(23, 18, 5),
    new THREE.MeshStandardMaterial({ color: "#22292d", roughness: 0.72 }),
  );
  radio.position.set(14, 0, 33);
  robot.add(radio);

  for (const side of [-1, 1]) {
    const header = new THREE.Mesh(
      new THREE.BoxGeometry(53, 4, 6),
      new THREE.MeshStandardMaterial({ color: "#2f3539", roughness: 0.68 }),
    );
    header.position.set(10, side * 18, 33);
    robot.add(header);
  }

  const sensorBoard = new THREE.Mesh(
    new THREE.BoxGeometry(9, 40, 6),
    new THREE.MeshStandardMaterial({ color: "#b83b35", roughness: 0.64 }),
  );
  sensorBoard.position.set(89, 0, 28);
  robot.add(sensorBoard);
  for (const side of [-1, 1]) {
    const transducer = new THREE.Mesh(
      new THREE.CylinderGeometry(7, 7, 6, 28),
      new THREE.MeshStandardMaterial({ color: "#d5dadd", roughness: 0.52 }),
    );
    transducer.rotation.x = Math.PI / 2;
    transducer.position.set(94, side * 11, 30);
    robot.add(transducer);
  }

  const heading = new THREE.Mesh(
    new THREE.ConeGeometry(5, 17, 3),
    new THREE.MeshBasicMaterial({ color: "#003660" }),
  );
  heading.rotation.z = -Math.PI / 2;
  heading.position.set(107, 0, 12);
  robot.add(heading);

  scene.add(robot);
  return robot;
}

function disposeMaterial(material: THREE.Material): void {
  const mapped = material as THREE.Material & { map?: THREE.Texture | null };
  mapped.map?.dispose();
  material.dispose();
}

export function WorldView({
  onScenarioChange,
  poseLabel,
  sample,
  scenario,
  scenarioDisabled = false,
}: WorldViewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const robotRef = useRef<THREE.Group | null>(null);
  const trailRef = useRef<THREE.Line | null>(null);
  const rangeRef = useRef<THREE.Line | null>(null);
  const resizeRef = useRef<(() => void) | null>(null);
  const trailPoints = useRef<THREE.Vector3[]>([]);
  const lastSequence = useRef(-1);
  const [viewZoom, setViewZoom] = useState<1 | 3>(1);
  const viewZoomRef = useRef<1 | 3>(viewZoom);
  viewZoomRef.current = viewZoom;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#f7f8f8");
    sceneRef.current = scene;
    const camera = new THREE.OrthographicCamera(
      -1_200,
      1_200,
      900,
      -900,
      1,
      4_000,
    );
    camera.position.set(sample.xMm, sample.yMm, 2_200);
    camera.lookAt(sample.xMm, sample.yMm, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    rendererRef.current = renderer;
    host.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight("#ffffff", 1.8));
    const key = new THREE.DirectionalLight("#ffffff", 2.1);
    key.position.set(-300, -250, 700);
    scene.add(key);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(WORLD_WIDTH_MM, WORLD_HEIGHT_MM),
      new THREE.MeshStandardMaterial({
        color: "#eef1f2",
        metalness: 0,
        roughness: 0.94,
      }),
    );
    floor.position.z = -12;
    scene.add(floor);
    addBoundedGrid(scene);

    const obstacles = scenario ? SIMULATION_SCENARIOS[scenario].obstacles : [];
    for (const obstacle of obstacles) {
      const width = obstacle.maximumXmm - obstacle.minimumXmm;
      const height = obstacle.maximumYmm - obstacle.minimumYmm;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, 26),
        new THREE.MeshStandardMaterial({
          color: "#a7423c",
          metalness: 0,
          roughness: 0.74,
        }),
      );
      mesh.position.set(
        (obstacle.minimumXmm + obstacle.maximumXmm) / 2,
        (obstacle.minimumYmm + obstacle.maximumYmm) / 2,
        1,
      );
      scene.add(mesh);
    }

    robotRef.current = addRobotModel(scene);
    const trail = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: "#006c64" }),
    );
    trail.position.z = 1;
    scene.add(trail);
    trailRef.current = trail;

    const range = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: "#765000" }),
    );
    range.position.z = 3;
    scene.add(range);
    rangeRef.current = range;

    const resize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      const vertical = WORLD_VERTICAL_SPAN_MM / viewZoomRef.current;
      const horizontal = vertical * (width / height);
      camera.left = -horizontal / 2;
      camera.right = horizontal / 2;
      camera.top = vertical / 2;
      camera.bottom = -vertical / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      renderer.render(scene, camera);
    };
    resizeRef.current = resize;
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    return () => {
      resizeObserver.disconnect();
      scene.traverse((object) => {
        const disposable = object as THREE.Mesh | THREE.Line;
        disposable.geometry?.dispose();
        const material = disposable.material;
        if (Array.isArray(material)) {
          material.forEach(disposeMaterial);
        } else if (material) {
          disposeMaterial(material);
        }
      });
      renderer.dispose();
      host.removeChild(renderer.domElement);
      cameraRef.current = null;
      rendererRef.current = null;
      sceneRef.current = null;
      robotRef.current = null;
      trailRef.current = null;
      rangeRef.current = null;
      resizeRef.current = null;
      trailPoints.current = [];
      lastSequence.current = -1;
    };
  }, [scenario]);

  useEffect(() => {
    const robot = robotRef.current;
    const camera = cameraRef.current;
    const trail = trailRef.current;
    const range = rangeRef.current;
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    if (!robot || !trail || !range || !camera || !renderer || !scene) {
      return;
    }
    if (sample.seq !== lastSequence.current) {
      if (sample.seq === 0 && lastSequence.current > 0) {
        trailPoints.current = [];
      }
      lastSequence.current = sample.seq;
      trailPoints.current.push(new THREE.Vector3(sample.xMm, sample.yMm, 1));
      if (trailPoints.current.length > 1_200) {
        trailPoints.current.shift();
      }
      trail.geometry.dispose();
      trail.geometry = new THREE.BufferGeometry().setFromPoints(
        trailPoints.current,
      );
    }

    robot.position.set(sample.xMm, sample.yMm, 0);
    robot.rotation.z = sample.headingRad;
    if (viewZoom > 1) {
      camera.position.x = sample.xMm;
      camera.position.y = sample.yMm - 40;
      camera.lookAt(sample.xMm, sample.yMm, 0);
    } else {
      camera.position.x = 0;
      camera.position.y = 0;
      camera.lookAt(0, 0, 0);
    }

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
    resizeRef.current?.();
    renderer.render(scene, camera);
  }, [sample, viewZoom]);

  return (
    <div
      aria-describedby="world-grid-description"
      aria-label="Top-down XRP world with millimeter grid"
      className="world-view"
      data-arena-mm={`${WORLD_WIDTH_MM} × ${WORLD_HEIGHT_MM}`}
      data-pose-state={sample.poseAvailable ? "published" : "centered-preview"}
      data-testid="world-view"
      data-xrp-footprint-mm={`${XRP_CHASSIS_LENGTH_MM} × ${XRP_CHASSIS_WIDTH_MM}`}
      ref={hostRef}
    >
      <span className="visually-hidden" id="world-grid-description">
        The arena spans x from −1200 to 1200 millimeters and y from −900 to 900
        millimeters. Major grid lines and values are labeled every 500
        millimeters.
      </span>
      <div className="world-overlay">
        <b className="world-section-label">World</b>
        {scenario && onScenarioChange ? (
          <select
            aria-label="Virtual scene"
            disabled={scenarioDisabled}
            onChange={(event) =>
              onScenarioChange(event.target.value as SimulationScenario)
            }
            title="Choose the virtual arena condition. Changing it resets the virtual XRP."
            value={scenario}
          >
            {Object.entries(SIMULATION_SCENARIOS).map(
              ([scenarioId, configuration]) => (
                <option key={scenarioId} value={scenarioId}>
                  {configuration.label}
                </option>
              ),
            )}
          </select>
        ) : null}
        <span>{poseLabel}</span>
        <span>
          range{" "}
          {sample.rangeMm === null ? "—" : `${sample.rangeMm.toFixed(0)} mm`}
        </span>
        {sample.collision ? <strong>Contact</strong> : null}
      </div>
      <button
        aria-pressed={viewZoom > 1}
        className="world-view-toggle"
        onClick={() => setViewZoom((current) => (current === 1 ? 3 : 1))}
        title="Switch between the full arena and a closer robot view."
        type="button"
      >
        {viewZoom === 1 ? "Zoom XRP" : "Fit world"}
      </button>
    </div>
  );
}
