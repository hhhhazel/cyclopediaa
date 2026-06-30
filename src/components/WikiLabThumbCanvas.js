"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";

export const WIKI_LAB_HTML_CONFIG = {
  position: [0, 0.08, 0.6],
  width: 270,
  height: 250,
  distanceFactor: 2,
  center: false
};

export const WIKI_LAB_GROUP_CONFIG = {
  rotationRest: -0.1501,
  rotationActive: 1.8169,
  damp: 8
};

function LabToggleGroup({ isActive }) {
  const groupRef = useRef(null);
  const targetRotation = isActive
    ? WIKI_LAB_GROUP_CONFIG.rotationActive
    : WIKI_LAB_GROUP_CONFIG.rotationRest;

  useFrame(function (_, delta) {
    const group = groupRef.current;

    if (!group) {
      return;
    }

    group.rotation.x = THREE.MathUtils.damp(
      group.rotation.x,
      targetRotation,
      WIKI_LAB_GROUP_CONFIG.damp,
      delta
    );
  });

  return (
    <group ref={groupRef} rotation={[WIKI_LAB_GROUP_CONFIG.rotationRest, 0, 0]}>
      <ambientLight intensity={1} />

      <Model rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} scale={0.1} />

      <Html
        transform
        pointerEvents="none"
        position={WIKI_LAB_HTML_CONFIG.position}
        distanceFactor={WIKI_LAB_HTML_CONFIG.distanceFactor}
        center={WIKI_LAB_HTML_CONFIG.center}
      >
        <img
          src="/wiki/show (28).png"
          alt="Cyberclone Laboratory"
          width={WIKI_LAB_HTML_CONFIG.width}
          height={WIKI_LAB_HTML_CONFIG.height}
          className={
            isActive
              ? "wiki-lab-thumb-canvas-image is-hidden"
              : "wiki-lab-thumb-canvas-image"
          }
          draggable={false}
        />
      </Html>
    </group>
  );
}

export default function WikiLabThumbCanvas() {
  const [isActive, setIsActive] = useState(false);

  function handleContainerClick(event) {
    event.preventDefault();
    event.stopPropagation();

    setIsActive(function (active) {
      return !active;
    });
  }

  return (
    <div
      className="wiki-lab-thumb-canvas"
      aria-label="Cyberclone Laboratory"
      role="button"
      tabIndex={0}
      onClick={handleContainerClick}
      onKeyDown={function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleContainerClick(event);
        }
      }}
    >
      <Canvas
        camera={{ position: [0, 0.5, 2.6], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        style={{ pointerEvents: "none", width: "100%", height: "100%" }}
      >
        <LabToggleGroup isActive={isActive} />
      </Canvas>
    </div>
  );
}

function Model(props) {
  const { nodes, materials } = useGLTF("/models/microscope2.glb");

  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_10.geometry}
        material={materials["Material.002"]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_11.geometry}
        material={materials["Material.013"]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_12.geometry}
        material={materials["Material.005"]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_13.geometry}
        material={materials["Material.015"]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_14.geometry}
        material={materials["Material.006"]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_15.geometry}
        material={materials["Material.009"]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_16.geometry}
        material={materials["Material.012"]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_17.geometry}
        material={materials["Material.008"]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_18.geometry}
        material={materials["Material.007"]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_19.geometry}
        material={materials["Material.014"]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_4.geometry}
        material={materials["Material.001"]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_5.geometry}
        material={materials["Material.003"]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_6.geometry}
        material={materials["Material.004"]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_7.geometry}
        material={materials["Material.010"]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_8.geometry}
        material={materials["Material.011"]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_9.geometry}
        material={materials["Material.016"]}
      />
    </group>
  );
}

useGLTF.preload("/models/microscope2.glb");
