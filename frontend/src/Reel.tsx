import React, { forwardRef, ForwardedRef } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { GLTF } from 'three-stdlib';

type GLTFResult = GLTF & {
  nodes: { Cylinder: THREE.Mesh; Cylinder_1: THREE.Mesh; };
  materials: { ['Material.001']: THREE.MeshStandardMaterial; ['Material.002']: THREE.MeshStandardMaterial; };
};

const Reel = forwardRef((props: any, ref: ForwardedRef<THREE.Group>) => {
  // Загружаем модель (убедись, что путь верный: public/models/reel.glb)
  const { nodes, materials } = useGLTF('/models/reel.glb') as unknown as GLTFResult;
  
  // Загружаем текстуры (убедись, что пути верны: public/images/reel_x.png)
  const textures = useTexture([
    '/images/reel_0.png',
    '/images/reel_1.png',
    '/images/reel_2.png'
  ]);

  // Защита: если модель еще не прогрузилась, возвращаем null
  if (!nodes || !nodes.Cylinder) return null;

  return (
    <group {...props} dispose={null}>
      {/* SlotMachine крутит rotation.x именно этой группы */}
      <group ref={ref} rotation={[0, 0, -Math.PI / 2]} scale={[1, 0.29, 1]}>
        <mesh geometry={nodes.Cylinder.geometry}>
          {/* Используем textures[props.map] с фолбеком на первую текстуру */}
          <meshStandardMaterial 
            map={textures[props.map] || textures[0]} 
            metalness={0.5} 
            roughness={0.5} 
          />
        </mesh>
        <mesh 
          geometry={nodes.Cylinder_1.geometry} 
          material={materials['Material.002']} 
        />
      </group>
    </group>
  );
});

// Предзагрузка для скорости
useGLTF.preload('/models/reel.glb');
export default Reel;
