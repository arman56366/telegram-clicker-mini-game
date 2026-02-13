/*
 * Copyright (c) Michael Kolesidis <michael.kolesidis@gmail.com>
 * GNU Affero General Public License v3.0
 */

import React from 'react';
import { useRef, forwardRef, ForwardedRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { GLTF } from 'three-stdlib';
// ИМПОРТ ВОССТАНОВЛЕН
import useGame from "./stores/store";
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
  value?: number;
  reelSegment: number;
  map: number;
};

const Reel = forwardRef(
  (props: ReelProps, ref: ForwardedRef<THREE.Group>): React.JSX.Element => {
    // ПОДПИСКА НА СОСТОЯНИЕ
    const phase = useGame((state: any) => state.phase);
    const { reelSegment } = props;

    const gltf = useGLTF('/models/reel.glb') as unknown as GLTFResult;
    const { nodes, materials } = gltf;

    const reelGroup = useRef<THREE.Group>(null);

    // Загрузка текстур
    const colorMap0 = useLoader(THREE.TextureLoader, '/images/reel_0.png');
    const colorMap1 = useLoader(THREE.TextureLoader, '/images/reel_1.png');
    const colorMap2 = useLoader(THREE.TextureLoader, '/images/reel_2.png');
    
    let activeColorMap;
    switch (props.map) {
      case 0: activeColorMap = colorMap0; break;
      case 1: activeColorMap = colorMap1; break;
      case 2: activeColorMap = colorMap2; break;
      default: activeColorMap = colorMap0;
    }

    // ЛОГИКА ВРАЩЕНИЯ
    useFrame((state, delta) => {
      if (reelGroup.current && phase === 'spinning') {
        // Вращаем только если фаза 'spinning'
        // Используем delta для плавной скорости независимо от FPS
        reelGroup.current.rotation.x += delta * 15; 
      }
    });

    return (
      <group {...props} ref={ref} dispose={null}>
        <group
          ref={reelGroup} // ДОБАВИЛИ REF СЮДА
          rotation={[reelSegment * WHEEL_SEGMENT - 0.2, 0, -Math.PI / 2]}
          scale={[1, 0.29, 1]}
        >
          <mesh castShadow receiveShadow geometry={nodes.Cylinder.geometry}>
            <meshStandardMaterial map={activeColorMap} />
          </mesh>
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
