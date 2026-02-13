import { useRef, Suspense } from 'react';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';
import Lights from './lights/Lights';
import SlotMachine from './SlotMachine';
import Bars from './Bars';
import useGame from './stores/store';

const Game = () => {
  const { showBars } = useGame((state: any) => state);
  const slotMachineRef = useRef<THREE.Group | null>(null);

  return (
    <>
      <color args={['#141417']} attach="background" />
      
      <OrbitControls enableZoom={false} />
      
      {/* Обязательно добавляем освещение, иначе модели будут черными */}
      <Lights />
      
      {/* Suspense показывает заглушку (null), пока грузятся модели и текстуры */}
      <Suspense fallback={null}>
        {showBars && <Bars />}
        <SlotMachine ref={slotMachineRef} />
      </Suspense>
    </>
  );
};

export default Game;
