/*
 * Copyright (c) Michael Kolesidis <michael.kolesidis@gmail.com>
 * GNU Affero General Public License v3.0
 */

import React from 'react';
import { forwardRef, ForwardedRef } from 'react';
import { useLoader } from '@react-three/fiber';
import { useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { GLTF } from 'three-stdlib';
import { WHEEL_SEGMENT } from './utils/constants';

type GLTFResult = GLTF & {
  nodes: {
    Cylinder: THREE.Mesh;
    Cylinder_1: THREE.Mesh;
  };
  materials: {
    ['Material.001']: THREE.MeshStandardMaterial;
    ['Material.002']: THREE.MeshStandardMaterial;
  };
};

type ReelProps = React.JSX.IntrinsicElements['group'] & {
  map: number;
};

const Reel = forwardRef(
  (props: ReelProps, ref: ForwardedRef<THREE.Group>): React.JSX.Element => {
    // 1. Загружаем модель
    const { nodes, materials } = useGLTF('/models/reel.glb') as unknown as GLTFResult;

    // 2. Загружаем текстуры через useTexture (это надежнее для React Three Fiber)
    // Убедитесь, что файлы лежат в public/images/
    const textures = useTexture([
      '/images/reel_0.png',
      '/images/reel_1.png',
      '/images/reel_2.png'
    ]);

    // Выбираем нужную текстуру
    const activeColorMap = textures[props.map] || textures[0];

    return (
      <group {...props} dispose={null}>
        <group 
          ref={ref} // Тот самый ref, который крутит SlotMachine
          rotation={[0, 0, -Math.PI / 2]} // Начальный поворот (0 по X)
          scale={[1, 0.29, 1]}
        >
          {/* Основная часть барабана с фруктами */}
          <mesh castShadow receiveShadow geometry={nodes.Cylinder.geometry}>
            <meshStandardMaterial map={activeColorMap} metalness={0.5} roughness={0.5} />
          </mesh>
          {/* Боковые части барабана */}
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Cylinder_1.geometry}
            material={materials['Material.002']}
          />
        </group>
      </group>
    );
  }
);

useGLTF.preload('/models/reel.glb');
export default Reel;
