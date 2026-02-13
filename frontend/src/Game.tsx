/*
 * Copyright (c) Michael Kolesidis <michael.kolesidis@gmail.com>
 * GNU Affero General Public License v3.0
 */

import { useRef } from 'react';
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
      {/* Фон сцены */}
      <color args={['#141417']} attach="background" />
      
      {/* Управление камерой (зум отключен для стабильности) */}
      <OrbitControls enableZoom={false} />
      
      {/* Освещение */}
      <Lights />
      
      {/* Сетка/бары (если включены в меню) */}
      {showBars && <Bars />}
      
      {/* Основной компонент игры, где теперь живет вся логика */}
      <SlotMachine ref={slotMachineRef} />
    </>
  );
};

export default Game;
