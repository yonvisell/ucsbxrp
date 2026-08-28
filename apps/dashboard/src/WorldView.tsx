import { useEffect, useRef } from "react";
import * as THREE from "three";
import { MapControls } from "three/examples/jsm/controls/MapControls.js";

import {
  XRP_CHASSIS_LENGTH_MM,
  XRP_ULTRASONIC_FIELD_OF_VIEW_DEG,
  XRP_ULTRASONIC_FIELD_OF_VIEW_RAD,
  XRP_ULTRASONIC_SENSOR_OFFSET_MM,
  ultrasonicSensorOrigin,
} from "@ucsb-xrp/simulator";
import {
  type TelemetrySample,
  type WorldCatalog,
  type WorldDefinition,
} from "@ucsb-xrp/target";

import type { MonitorAnnotation } from "./monitor-export";
import {
  worldMarkerLabelPosition,
  worldMarkerVisualStyle,
} from "./world-marker-visual";

interface WorldViewProps {
  annotations?: readonly MonitorAnnotation[];
  catalog: WorldCatalog;
  onWorldChange?: (worldId: string) => void;
  sample: TelemetrySample;
  samples?: readonly TelemetrySample[];
  selectedWorldId: string;
  worldSelectionDisabled?: boolean;
  showAnnotations?: boolean;
}

const MINOR_GRID_MM = 100;
const MAJOR_GRID_MM = 500;

// Official Open-STEM V1.3 chassis bounds and SparkFun controller drawing;
// wheel geometry uses the measured course configuration.
const XRP_CHASSIS_WIDTH_MM = 190.5;
const XRP_CONTROLLER_LENGTH_MM = 63.5;
const XRP_CONTROLLER_WIDTH_MM = 54;
const XRP_TRACK_WIDTH_MM = 155;
const XRP_WHEEL_DIAMETER_MM = 60;
const RANGE_SECTOR_ARC_SEGMENTS = 16;

interface RangeSectorVisual {
  fill: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
  group: THREE.Group;
  outline: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>;
}

export interface WorldViewSpans {
  horizontalMm: number;
  verticalMm: number;
}

/** Fit the complete world at any viewport aspect ratio without distortion. */
export function fittedWorldViewSpans(
  bounds: WorldDefinition["bounds"],
  viewportWidth: number,
  viewportHeight: number,
  marginMm = 90,
): WorldViewSpans {
  const aspect = Math.max(viewportWidth, 1) / Math.max(viewportHeight, 1);
  const requiredWidth = bounds.maximumXmm - bounds.minimumXmm + marginMm * 2;
  const requiredHeight = bounds.maximumYmm - bounds.minimumYmm + marginMm * 2;
  const verticalMm = Math.max(requiredHeight, requiredWidth / aspect);
  return { horizontalMm: verticalMm * aspect, verticalMm };
}

/** Build independent path segments so a reset or source change cannot join poses. */
export function worldTrailSegmentPoints(
  samples: readonly TelemetrySample[],
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1]!;
    const current = samples[index]!;
    if (
      !previous.poseAvailable ||
      !current.poseAvailable ||
      previous.source !== current.source ||
      current.seq <= previous.seq ||
      current.tMs < previous.tMs
    ) {
      continue;
    }
    points.push(
      new THREE.Vector3(previous.xMm, previous.yMm, 1),
      new THREE.Vector3(current.xMm, current.yMm, 1),
    );
  }
  return points;
}

function rangeSectorGeometry(rangeMm: number): {
  fill: THREE.ShapeGeometry;
  outline: THREE.BufferGeometry;
} {
  const halfAngleRad = XRP_ULTRASONIC_FIELD_OF_VIEW_RAD / 2;
  const shape = new THREE.Shape();
  const outlinePoints = [new THREE.Vector3(0, 0, 0)];
  shape.moveTo(0, 0);
  for (let index = 0; index <= RANGE_SECTOR_ARC_SEGMENTS; index += 1) {
    const fraction = index / RANGE_SECTOR_ARC_SEGMENTS;
    const angleRad =
      -halfAngleRad + fraction * XRP_ULTRASONIC_FIELD_OF_VIEW_RAD;
    const xMm = rangeMm * Math.cos(angleRad);
    const yMm = rangeMm * Math.sin(angleRad);
    shape.lineTo(xMm, yMm);
    outlinePoints.push(new THREE.Vector3(xMm, yMm, 0));
  }
  shape.closePath();
  outlinePoints.push(new THREE.Vector3(0, 0, 0));
  return {
    fill: new THREE.ShapeGeometry(shape),
    outline: new THREE.BufferGeometry().setFromPoints(outlinePoints),
  };
}

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

function textSprite(
  text: string,
  widthMm = 176,
  color = "#34444d",
): THREE.Sprite {
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
  context.font = "700 48px system-ui, sans-serif";
  context.lineWidth = 7;
  context.strokeStyle = "rgba(255, 255, 255, 0.96)";
  context.strokeText(text, canvas.width / 2, canvas.height / 2);
  context.fillStyle = color;
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
  sprite.userData.labelWidthMm = widthMm;
  sprite.userData.labelHeightMm = 42;
  sprite.renderOrder = 5;
  return sprite;
}

function addBoundedGrid(
  scene: THREE.Scene,
  bounds: WorldDefinition["bounds"],
): void {
  const minor: THREE.Vector3[] = [];
  const major: THREE.Vector3[] = [];

  for (
    let x = Math.ceil(bounds.minimumXmm / MINOR_GRID_MM) * MINOR_GRID_MM;
    x < bounds.maximumXmm;
    x += MINOR_GRID_MM
  ) {
    const points = x % MAJOR_GRID_MM === 0 ? major : minor;
    points.push(
      new THREE.Vector3(x, bounds.minimumYmm, 0),
      new THREE.Vector3(x, bounds.maximumYmm, 0),
    );
  }
  for (
    let y = Math.ceil(bounds.minimumYmm / MINOR_GRID_MM) * MINOR_GRID_MM;
    y < bounds.maximumYmm;
    y += MINOR_GRID_MM
  ) {
    const points = y % MAJOR_GRID_MM === 0 ? major : minor;
    points.push(
      new THREE.Vector3(bounds.minimumXmm, y, 0),
      new THREE.Vector3(bounds.maximumXmm, y, 0),
    );
  }

  addSegments(scene, minor, "#d5dadd", -9);
  addSegments(scene, major, "#aeb8bd", -8);
  const axes: THREE.Vector3[] = [];
  if (bounds.minimumYmm <= 0 && bounds.maximumYmm >= 0) {
    axes.push(
      new THREE.Vector3(bounds.minimumXmm, 0, 0),
      new THREE.Vector3(bounds.maximumXmm, 0, 0),
    );
  }
  if (bounds.minimumXmm <= 0 && bounds.maximumXmm >= 0) {
    axes.push(
      new THREE.Vector3(0, bounds.minimumYmm, 0),
      new THREE.Vector3(0, bounds.maximumYmm, 0),
    );
  }
  addSegments(scene, axes, "#687a84", -7);

  const borderMaterial = new THREE.MeshBasicMaterial({ color: "#46545b" });
  const worldWidth = bounds.maximumXmm - bounds.minimumXmm;
  const worldHeight = bounds.maximumYmm - bounds.minimumYmm;
  const borderThickness = 8;
  for (const y of [bounds.minimumYmm, bounds.maximumYmm]) {
    const border = new THREE.Mesh(
      new THREE.PlaneGeometry(worldWidth + borderThickness, borderThickness),
      borderMaterial,
    );
    border.position.set((bounds.minimumXmm + bounds.maximumXmm) / 2, y, -6);
    scene.add(border);
  }
  for (const x of [bounds.minimumXmm, bounds.maximumXmm]) {
    const border = new THREE.Mesh(
      new THREE.PlaneGeometry(borderThickness, worldHeight + borderThickness),
      borderMaterial,
    );
    border.position.set(x, (bounds.minimumYmm + bounds.maximumYmm) / 2, -6);
    scene.add(border);
  }

  const labelInset = Math.min(
    42,
    (bounds.maximumYmm - bounds.minimumYmm) * 0.035,
  );
  for (
    let x = Math.ceil(bounds.minimumXmm / MAJOR_GRID_MM) * MAJOR_GRID_MM;
    x <= bounds.maximumXmm;
    x += MAJOR_GRID_MM
  ) {
    const label = textSprite(String(x), 190);
    label.position.set(x, bounds.minimumYmm + labelInset, 4);
    scene.add(label);
  }
  for (
    let y = Math.ceil(bounds.minimumYmm / MAJOR_GRID_MM) * MAJOR_GRID_MM;
    y <= bounds.maximumYmm;
    y += MAJOR_GRID_MM
  ) {
    if (y === 0) continue;
    const label = textSprite(String(y), 165);
    label.position.set(bounds.minimumXmm + 72, y, 4);
    scene.add(label);
  }
  const xAxisLabel = textSprite("x (mm)", 160);
  xAxisLabel.position.set(
    bounds.maximumXmm - 95,
    bounds.minimumYmm + labelInset * 2.1,
    4,
  );
  scene.add(xAxisLabel);
  const yAxisLabel = textSprite("y (mm)", 160);
  yAxisLabel.position.set(bounds.minimumXmm + 95, bounds.maximumYmm - 45, 4);
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

function disposeObject(object: THREE.Object3D): void {
  object.traverse((descendant) => {
    const disposable = descendant as THREE.Mesh | THREE.Line | THREE.Sprite;
    disposable.geometry?.dispose();
    const material = disposable.material;
    if (Array.isArray(material)) material.forEach(disposeMaterial);
    else if (material) disposeMaterial(material);
  });
}

export function WorldView({
  annotations = [],
  catalog,
  onWorldChange,
  sample,
  samples = [],
  selectedWorldId,
  worldSelectionDisabled = false,
  showAnnotations = true,
}: WorldViewProps) {
  const world =
    catalog.worlds.find((candidate) => candidate.id === selectedWorldId) ??
    catalog.worlds[0]!;
  const worldWidthMm = world.bounds.maximumXmm - world.bounds.minimumXmm;
  const worldHeightMm = world.bounds.maximumYmm - world.bounds.minimumYmm;
  const worldCenterX = (world.bounds.minimumXmm + world.bounds.maximumXmm) / 2;
  const worldCenterY = (world.bounds.minimumYmm + world.bounds.maximumYmm) / 2;
  const viewRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const robotRef = useRef<THREE.Group | null>(null);
  const trailRef = useRef<THREE.LineSegments | null>(null);
  const rangeRef = useRef<RangeSectorVisual | null>(null);
  const annotationGroupRef = useRef<THREE.Group | null>(null);
  const controlsRef = useRef<MapControls | null>(null);
  const resizeRef = useRef<(() => void) | null>(null);
  const renderRef = useRef<(() => void) | null>(null);
  const fitWorldRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#f7f8f8");
    sceneRef.current = scene;
    const camera = new THREE.OrthographicCamera(
      world.bounds.minimumXmm,
      world.bounds.maximumXmm,
      world.bounds.maximumYmm,
      world.bounds.minimumYmm,
      1,
      4_000,
    );
    camera.position.set(worldCenterX, worldCenterY, 2_200);
    camera.lookAt(worldCenterX, worldCenterY, 0);
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
      new THREE.PlaneGeometry(worldWidthMm, worldHeightMm),
      new THREE.MeshStandardMaterial({
        color: "#eef1f2",
        metalness: 0,
        roughness: 0.94,
      }),
    );
    floor.position.x = worldCenterX;
    floor.position.y = worldCenterY;
    floor.position.z = -12;
    scene.add(floor);
    addBoundedGrid(scene, world.bounds);

    for (const obstacle of world.obstacles) {
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
      if (obstacle.label) {
        const label = textSprite(
          obstacle.label,
          Math.min(360, Math.max(150, obstacle.label.length * 11)),
        );
        label.position.set(mesh.position.x, mesh.position.y, 18);
        scene.add(label);
      }
    }

    for (const marker of world.markers) {
      const style = worldMarkerVisualStyle(marker);
      if (marker.type === "waypoint" || marker.type === "marker") {
        const ring = new THREE.Mesh(
          marker.type === "waypoint"
            ? new THREE.RingGeometry(18, 23, 28)
            : new THREE.RingGeometry(12, 18, 4),
          new THREE.MeshBasicMaterial({
            color: style.color,
            side: THREE.DoubleSide,
          }),
        );
        ring.position.set(marker.xMm, marker.yMm, 2);
        if (marker.type === "marker") ring.rotation.z = Math.PI / 4;
        scene.add(ring);
      } else {
        const points =
          "x1Mm" in marker
            ? [
                new THREE.Vector3(marker.x1Mm, marker.y1Mm, 2),
                new THREE.Vector3(marker.x2Mm, marker.y2Mm, 2),
              ]
            : [
                new THREE.Vector3(marker.minimumXmm, marker.minimumYmm, 2),
                new THREE.Vector3(marker.maximumXmm, marker.minimumYmm, 2),
                new THREE.Vector3(marker.maximumXmm, marker.maximumYmm, 2),
                new THREE.Vector3(marker.minimumXmm, marker.maximumYmm, 2),
                new THREE.Vector3(marker.minimumXmm, marker.minimumYmm, 2),
              ];
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(points),
          style.dashed
            ? new THREE.LineDashedMaterial({
                color: style.color,
                dashSize: 28,
                gapSize: 18,
              })
            : new THREE.LineBasicMaterial({ color: style.color }),
        );
        if (style.dashed) line.computeLineDistances();
        scene.add(line);
      }
      if (marker.label) {
        const position = worldMarkerLabelPosition(marker);
        const label = textSprite(
          marker.label,
          Math.min(360, Math.max(150, marker.label.length * 11)),
          style.color,
        );
        label.position.set(position.xMm, position.yMm, 6);
        scene.add(label);
      }
    }

    robotRef.current = addRobotModel(scene);
    const trail = new THREE.LineSegments(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: "#006c64" }),
    );
    trail.position.z = 1;
    scene.add(trail);
    trailRef.current = trail;

    const rangeGroup = new THREE.Group();
    rangeGroup.position.z = 3;
    const rangeFill = new THREE.Mesh(
      new THREE.BufferGeometry(),
      new THREE.MeshBasicMaterial({
        color: "#b98a29",
        depthWrite: false,
        opacity: 0.11,
        side: THREE.DoubleSide,
        transparent: true,
      }),
    );
    rangeFill.renderOrder = 2;
    const rangeOutline = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({
        color: "#765000",
        opacity: 0.68,
        transparent: true,
      }),
    );
    rangeOutline.position.z = 0.2;
    rangeOutline.renderOrder = 3;
    rangeGroup.add(rangeFill, rangeOutline);
    scene.add(rangeGroup);
    rangeRef.current = {
      fill: rangeFill,
      group: rangeGroup,
      outline: rangeOutline,
    };

    const annotationGroup = new THREE.Group();
    scene.add(annotationGroup);
    annotationGroupRef.current = annotationGroup;

    const controls = new MapControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controls.enableRotate = false;
    controls.screenSpacePanning = true;
    controls.zoomToCursor = true;
    controls.minZoom = 0.35;
    controls.maxZoom = 12;
    controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
    controls.mouseButtons.RIGHT = THREE.MOUSE.PAN;
    controls.target.set(worldCenterX, worldCenterY, 0);
    controlsRef.current = controls;

    const render = () => {
      const visibleVerticalMm =
        (camera.top - camera.bottom) / Math.max(camera.zoom, 0.001);
      const minimumLabelHeightMm =
        (visibleVerticalMm / Math.max(host.clientHeight, 1)) * 9;
      scene.traverse((object) => {
        if (!(object instanceof THREE.Sprite)) return;
        const baseWidth = Number(object.userData.labelWidthMm);
        const baseHeight = Number(object.userData.labelHeightMm);
        if (!Number.isFinite(baseWidth) || !Number.isFinite(baseHeight)) return;
        const labelHeight = Math.max(baseHeight, minimumLabelHeightMm);
        object.scale.set(
          labelHeight * (baseWidth / baseHeight),
          labelHeight,
          1,
        );
      });
      if (viewRef.current) {
        viewRef.current.dataset.minimumLabelPixels = "9";
      }
      renderer.render(scene, camera);
    };
    renderRef.current = render;
    controls.addEventListener("change", render);

    const resize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      const spans = fittedWorldViewSpans(world.bounds, width, height);
      camera.left = -spans.horizontalMm / 2;
      camera.right = spans.horizontalMm / 2;
      camera.top = spans.verticalMm / 2;
      camera.bottom = -spans.verticalMm / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      if (viewRef.current) {
        viewRef.current.dataset.horizontalSpanMm =
          spans.horizontalMm.toFixed(1);
        viewRef.current.dataset.verticalSpanMm = spans.verticalMm.toFixed(1);
      }
      render();
    };
    resizeRef.current = resize;
    fitWorldRef.current = () => {
      camera.zoom = 1;
      camera.position.x = worldCenterX;
      camera.position.y = worldCenterY;
      controls.target.set(worldCenterX, worldCenterY, 0);
      camera.updateProjectionMatrix();
      controls.update();
      resize();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    return () => {
      resizeObserver.disconnect();
      controls.removeEventListener("change", render);
      controls.dispose();
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
      annotationGroupRef.current = null;
      controlsRef.current = null;
      resizeRef.current = null;
      renderRef.current = null;
      fitWorldRef.current = null;
    };
  }, [world, worldCenterX, worldCenterY, worldHeightMm, worldWidthMm]);

  useEffect(() => {
    const robot = robotRef.current;
    const trail = trailRef.current;
    const range = rangeRef.current;
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    if (!robot || !trail || !range || !renderer || !scene) {
      return;
    }
    const trailSegments = worldTrailSegmentPoints(samples);
    trail.geometry.dispose();
    trail.geometry = new THREE.BufferGeometry().setFromPoints(trailSegments);
    if (viewRef.current) {
      viewRef.current.dataset.pathPointCount = String(
        samples.filter((historical) => historical.poseAvailable).length,
      );
      viewRef.current.dataset.pathSegmentCount = String(
        trailSegments.length / 2,
      );
    }

    robot.position.set(sample.xMm, sample.yMm, 0);
    robot.rotation.z = sample.headingRad;

    range.fill.geometry.dispose();
    range.outline.geometry.dispose();
    if (sample.rangeMm === null) {
      range.group.visible = false;
    } else {
      range.group.visible = true;
      const origin = ultrasonicSensorOrigin(
        {
          xMm: sample.xMm,
          yMm: sample.yMm,
          headingRad: sample.headingRad,
        },
        XRP_ULTRASONIC_SENSOR_OFFSET_MM,
      );
      range.group.position.set(origin.xMm, origin.yMm, 3);
      range.group.rotation.z = sample.headingRad;
      const geometry = rangeSectorGeometry(sample.rangeMm);
      range.fill.geometry = geometry.fill;
      range.outline.geometry = geometry.outline;
    }
    renderRef.current?.();
  }, [sample, samples]);

  useEffect(() => {
    const group = annotationGroupRef.current;
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!group || !renderer || !scene || !camera) return;
    for (const child of [...group.children]) {
      disposeObject(child);
      group.remove(child);
    }
    group.visible = showAnnotations;
    if (showAnnotations) {
      for (const annotation of annotations) {
        if (!annotation.poseAvailable) continue;
        const marker = new THREE.Mesh(
          new THREE.CircleGeometry(10, 20),
          new THREE.MeshBasicMaterial({ color: "#87515d", depthTest: false }),
        );
        marker.position.set(annotation.xMm, annotation.yMm, 7);
        marker.renderOrder = 7;
        group.add(marker);
        const labelText = `${(annotation.tMs / 1_000).toFixed(2)} s · ${annotation.label.slice(0, 32)}`;
        const label = textSprite(
          labelText,
          Math.min(420, Math.max(190, labelText.length * 11)),
        );
        label.position.set(annotation.xMm, annotation.yMm + 34, 8);
        label.renderOrder = 8;
        group.add(label);
      }
    }
    renderer.render(scene, camera);
  }, [annotations, showAnnotations, world]);

  return (
    <div
      aria-describedby="world-grid-description"
      aria-label="Top-down XRP world with millimeter grid"
      className="world-view"
      data-arena-mm={`${worldWidthMm} × ${worldHeightMm}`}
      data-pose-state={sample.poseAvailable ? "published" : "centered-preview"}
      data-testid="world-view"
      data-ultrasonic-field-of-view-deg={XRP_ULTRASONIC_FIELD_OF_VIEW_DEG}
      data-ultrasonic-origin-offset-mm={XRP_ULTRASONIC_SENSOR_OFFSET_MM}
      data-xrp-footprint-mm={`${XRP_CHASSIS_LENGTH_MM} × ${XRP_CHASSIS_WIDTH_MM}`}
      ref={viewRef}
    >
      <div className="world-toolbar">
        <b className="world-section-label">World</b>
        {onWorldChange ? (
          <select
            aria-label="World configuration"
            disabled={worldSelectionDisabled}
            onChange={(event) => onWorldChange(event.target.value)}
            title="Choose a world defined by this project's world.json file. Changing it resets the virtual XRP."
            value={world.id}
          >
            {catalog.worlds.map((configuration) => (
              <option key={configuration.id} value={configuration.id}>
                {configuration.label}
              </option>
            ))}
          </select>
        ) : null}
        <div className="world-view-controls" aria-label="World view controls">
          <button
            aria-label="Zoom out"
            onClick={() => {
              const camera = cameraRef.current;
              const controls = controlsRef.current;
              if (!camera || !controls) return;
              camera.zoom = Math.max(controls.minZoom, camera.zoom / 1.35);
              camera.updateProjectionMatrix();
              controls.update();
              renderRef.current?.();
            }}
            title="Zoom out. You can also use the mouse wheel or trackpad."
            type="button"
          >
            −
          </button>
          <button
            aria-label="Zoom in"
            onClick={() => {
              const camera = cameraRef.current;
              const controls = controlsRef.current;
              if (!camera || !controls) return;
              camera.zoom = Math.min(controls.maxZoom, camera.zoom * 1.35);
              camera.updateProjectionMatrix();
              controls.update();
              renderRef.current?.();
            }}
            title="Zoom in. Drag the world to pan."
            type="button"
          >
            +
          </button>
          <button
            aria-label="Fit world"
            onClick={() => fitWorldRef.current?.()}
            title="Fit the complete arena in the view."
            type="button"
          >
            Fit
          </button>
          <button
            aria-label="Center XRP"
            onClick={() => {
              const camera = cameraRef.current;
              const controls = controlsRef.current;
              if (!camera || !controls) return;
              camera.position.x = sample.xMm;
              camera.position.y = sample.yMm;
              controls.target.set(sample.xMm, sample.yMm, 0);
              controls.update();
              renderRef.current?.();
            }}
            title="Center the view on the XRP without changing the zoom."
            type="button"
          >
            XRP
          </button>
        </div>
        {!sample.poseAvailable ? (
          <span>Preview · no published pose</span>
        ) : null}
        {sample.collision ? <strong>Contact</strong> : null}
      </div>
      <div className="world-canvas" ref={hostRef}>
        <span className="visually-hidden" id="world-grid-description">
          The arena spans x from {world.bounds.minimumXmm} to{" "}
          {world.bounds.maximumXmm} millimeters and y from{" "}
          {world.bounds.minimumYmm} to {world.bounds.maximumYmm} millimeters.
          Major grid lines and values are labeled every 500 millimeters.
        </span>
        <div
          aria-label="World line legend: green is path; ochre is ultrasound distance"
          className="world-legend"
        >
          <span>
            <i className="path-line" /> path
          </span>
          <span>
            <i className="ultrasound-line" /> ultrasound distance
          </span>
        </div>
      </div>
    </div>
  );
}
