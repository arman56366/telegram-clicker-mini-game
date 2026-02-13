import React, { forwardRef, ForwardedRef } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { GLTF } from 'three-stdlib';

type GLTFResult = GLTF & {
  nodes: { Cylinder: THREE.Mesh; Cylinder_1: THREE.Mesh; };
  materials: { ['Material.001']: THREE.MeshStandardMaterial; ['Material.002']: THREE.MeshStandardMaterial; };
};

const Reel = forwardRef((props: any, ref: ForwardedRef<THREE.Group>) => {
  const { nodes, materials } = useGLTF('/models/reel.glb') as any;
  const textures = useTexture(['/images/reel_0.png', '/images/reel_1.png', '/images/reel_2.png']);

  return (
    <group {...props} dispose={null}>
      {/* ВАЖНО: ref именно здесь. SlotMachine будет крутить rotation.x этой группы */}
      <group ref={ref} rotation={[0, 0, -Math.PI / 2]} scale={[1, 0.29, 1]}>
        <mesh geometry={nodes.Cylinder.geometry}>
          <meshStandardMaterial map={textures[props.map]} />
        </mesh>
        <mesh geometry={nodes.Cylinder_1.geometry} material={materials['Material.002']} />
      </group>
    </group>
  );
});

export default Reel;
