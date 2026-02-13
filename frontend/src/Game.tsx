/*
 * Copyright (c) Michael Kolesidis <michael.kolesidis@gmail.com>
 * GNU Affero General Public License v3.0
 */

import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';
import Lights from './lights/Lights';
import SlotMachine from './SlotMachine';
import Bars from './Bars';
import useGame from './stores/store';

const Game = () => {
  const { 
    showBars, phase, end, setWin, updateCoins, bet, 
    setFruit0, setFruit1, setFruit2 
  } = useGame((state: any) => state);

  const slotMachineRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (phase === 'spinning') {
      const timer = setTimeout(() => {
        // ШАНС ВЫИГРЫША 20%
        const isWin = Math.random() < 0.2; 

        let f0, f1, f2;
        // Таблица выплат из твоего изображения:
        // 0: Вишня (50), 1: Яблоко (20), 2: Банан (15), 3: Апельсин (5)
        const payTable = [50, 20, 15, 5, 2, 1]; 

        if (isWin) {
          // Гарантируем победу: все три индекса одинаковые
          f0 = Math.floor(Math.random() * 4); 
          f1 = f0;
          f2 = f0;
          
          const prize = payTable[f0] || 0;
          const totalWin = prize * bet;
          
          setWin(totalWin);
          updateCoins(totalWin);
        } else {
          // Гарантируем проигрыш: первый и второй символы ВСЕГДА разные
          f0 = Math.floor(Math.random() * 6);
          f1 = (f0 + 1 + Math.floor(Math.random() * 4)) % 6; 
          f2 = Math.floor(Math.random() * 6);
          
          setWin(0);
        }

        // Обновляем фрукты в сторе
        setFruit0(f0);
        setFruit1(f1);
        setFruit2(f2);

        // Завершаем вращение
        end();
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [phase, end, bet, setWin, updateCoins, setFruit0, setFruit1, setFruit2]);

  return (
    <>
      <color args={['#141417']} attach="background" />
      <OrbitControls enableZoom={false} />
      <Lights />
      {showBars && <Bars />}
      <SlotMachine ref={slotMachineRef} />
    </>
  );
};

export default Game;
