import { useEffect, useRef } from "react";
import * as THREE from "three";

import type { TelemetrySample } from "@ucsb-xrp/target";

interface WorldViewProps {
  sample: TelemetrySample;
}

export function WorldView({ sample }: WorldViewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const robotRef = useRef<THREE.Group | null>(null);
  const trailRef = useRef<THREE.Line | null>(null);
  const trailPoints = useRef<THREE.Vector3[]>([]);
  const lastSequence = useRef(-1);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#09141d");
    const camera = new THREE.OrthographicCamera(-500, 500, 350, -350, 1, 3000);
    camera.position.set(0, -40, 1100);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    host.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight("#dcecff", 1.6);
    scene.add(ambient);
    const key = new THREE.DirectionalLight("#ffffff", 2.2);
    key.position.set(-300, -250, 700);
    scene.add(key);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(1200, 800),
      new THREE.MeshStandardMaterial({
        color: "#10202c",
        roughness: 0.92,
        metalness: 0,
      }),
    );
    floor.position.z = -12;
    scene.add(floor);

    const grid = new THREE.GridHelper(1200, 24, "#27475a", "#182e3d");
    grid.rotation.x = Math.PI / 2;
    grid.position.z = -10;
    scene.add(grid);

    const borderGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-600, -400, -8),
      new THREE.Vector3(600, -400, -8),
      new THREE.Vector3(600, 400, -8),
      new THREE.Vector3(-600, 400, -8),
    ]);
    const border = new THREE.LineLoop(
      borderGeometry,
      new THREE.LineBasicMaterial({ color: "#345a70" }),
    );
    scene.add(border);

    const robot = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(170, 112, 30),
      new THREE.MeshStandardMaterial({
        color: "#e4edf3",
        roughness: 0.5,
        metalness: 0.08,
      }),
    );
    body.position.z = 14;
    robot.add(body);

    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(95, 76, 18),
      new THREE.MeshStandardMaterial({ color: "#2ebcad", roughness: 0.45 }),
    );
    deck.position.set(-12, 0, 38);
    robot.add(deck);

    const wheelMaterial = new THREE.MeshStandardMaterial({
      color: "#101418",
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
      new THREE.MeshBasicMaterial({ color: "#f5ba57" }),
    );
    heading.rotation.z = -Math.PI / 2;
    heading.position.set(102, 0, 20);
    robot.add(heading);
    scene.add(robot);
    robotRef.current = robot;

    const trail = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: "#54d6c8" }),
    );
    trail.position.z = 1;
    scene.add(trail);
    trailRef.current = trail;

    const resize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      const vertical = 720;
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
      trailPoints.current = [];
    };
  }, []);

  useEffect(() => {
    const robot = robotRef.current;
    const trail = trailRef.current;
    if (!robot || !trail || sample.seq === lastSequence.current) {
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
  }, [sample]);

  return (
    <div
      aria-label="Top-down virtual XRP world"
      className="world-view"
      data-testid="world-view"
      ref={hostRef}
    />
  );
}
