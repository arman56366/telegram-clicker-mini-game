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
  // Добавляем phase и end для контроля вращения
  const { showBars, phase, end, setWin, updateCoins, bet } = useGame((state: any) => state);

  const slotMachineRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    // Если игра перешла в фазу вращения
    if (phase === 'spinning') {
      
      // Устанавливаем таймер на 2.5 секунды
      const timer = setTimeout(() => {
        // 1. Останавливаем вращение в сторе
        end();

        // 2. ЛОГИКА ВЫИГРЫША (упрощенная для проверки)
        // В будущем здесь будет проверка выпавших фруктов
        const isWin = Math.random() > 0.7; // 30% шанс на успех
        if (isWin) {
          const winAmount = bet * 5; // Выигрыш в 5 раз больше ставки
          setWin(winAmount);
          updateCoins(winAmount);
          console.log("You won!");
        } else {
          setWin(0);
          console.log("No win this time.");
        }

      }, 2500);

      // Очистка таймера при размонтировании
      return () => clearTimeout(timer);
    }
  }, [phase, end, bet, setWin, updateCoins]);

  return (
    <>
      <color args={['#141417']} attach="background" />
      <OrbitControls />
      <Lights />
      {showBars && <Bars />}
      {/* Передаем случайные значения для визуальной остановки, если SlotMachine это поддерживает */}
      <SlotMachine ref={slotMachineRef} value={[1, 2, 3]} />
    </>
  );
};

export default Game;
