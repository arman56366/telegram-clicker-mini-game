/*
 * Copyright (c) Michael Kolesidis <michael.kolesidis@gmail.com>
 * GNU Affero General Public License v3.0
 */

import { useRef, useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useGame from './stores/store';
import { WHEEL_SEGMENT } from './utils/constants';
import Reel from './Reel';
import Button from './Button';

interface ReelGroup extends THREE.Group {
  targetRotationX?: number;
  isSnapping?: boolean;
}

const SlotMachine = forwardRef((_props, ref) => {
  const {
    phase, start, end, addSpin,
    bet, coins, updateCoins, setWin,
    setFruit0, setFruit1, setFruit2
  } = useGame((state: any) => state);

  const reelRefs = [
    useRef<ReelGroup>(null),
    useRef<ReelGroup>(null),
    useRef<ReelGroup>(null),
  ];

  // Таблица выплат по индексам: 0-Cherry(50), 1-Apple(20), 2-Banana(15), 3-Orange(5)
  const payTable = [50, 20, 15, 5, 2, 1];

  const spinSlotMachine = () => {
    if (phase === 'spinning' || coins < bet) return;

    // 1. Сразу списываем ставку и запускаем фазу
    start(); 
    addSpin();
    setWin(0);

    // 2. Генерируем результат: ШАНС ВЫИГРЫША 20%
    const isWin = Math.random() < 0.2;
    let res: number[] = [0, 0, 0];

    if (isWin) {
      const winnerFruit = Math.floor(Math.random() * 4); // Только ценные фрукты
      res = [winnerFruit, winnerFruit, winnerFruit];
      
      const prize = payTable[winnerFruit] * bet;
      // Начисляем выигрыш сразу, но покажем его после остановки
      setTimeout(() => {
        setWin(prize);
        updateCoins(prize);
      }, 3000); 
    } else {
      // Генерируем проигрышную комбинацию
      res[0] = Math.floor(Math.random() * 6);
      res[1] = (res[0] + 1 + Math.floor(Math.random() * 3)) % 6; // Гарантированно другой
      res[2] = Math.floor(Math.random() * 6);
    }

    // Сохраняем в стор для синхронизации
    setFruit0(res[0]);
    setFruit1(res[1]);
    setFruit2(res[2]);

    // 3. Настраиваем анимацию барабанов
    for (let i = 0; i < 3; i++) {
      const reel = reelRefs[i].current;
      if (reel) {
        // Каждый барабан делает несколько полных кругов + смещение до нужного фрукта
        const extraSpins = (i + 2) * 10; 
        const targetSegment = res[i] + extraSpins;
        
        reel.targetRotationX = targetSegment * WHEEL_SEGMENT;
        reel.isSnapping = false;
      }
    }
  };

  useFrame((_state, delta) => {
    let allStopped = true;

    for (let i = 0; i < reelRefs.length; i++) {
      const reel = reelRefs[i].current;
      if (!reel || reel.targetRotationX === undefined) continue;

      allStopped = false;
      const step = delta * 15; // Скорость вращения

      if (!reel.isSnapping) {
        if (reel.rotation.x < reel.targetRotationX - step) {
          reel.rotation.x += step;
        } else {
          reel.isSnapping = true;
        }
      } else {
        // Плавная докрутка в конце
        reel.rotation.x = THREE.MathUtils.lerp(reel.rotation.x, reel.targetRotationX, 0.1);
        if (Math.abs(reel.rotation.x - reel.targetRotationX) < 0.01) {
          reel.rotation.x = reel.targetRotationX;
          reel.targetRotationX = undefined;
        }
      }
    }

    // Если все барабаны докрутились и мы были в фазе спина
    if (allStopped && phase === 'spinning') {
      end();
    }
  });

  // Управление пробелом
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') spinSlotMachine();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, coins, bet]);

  useImperativeHandle(ref, () => ({ reelRefs }));

  return (
    <>
      <Reel ref={reelRefs[0]} map={0} position={[-7, 0, 0]} scale={[10, 10, 10]} reelSegment={0} />
      <Reel ref={reelRefs[1]} map={1} position={[0, 0, 0]} scale={[10, 10, 10]} reelSegment={0} />
      <Reel ref={reelRefs[2]} map={2} position={[7, 0, 0]} scale={[10, 10, 10]} reelSegment={0} />
      
      <Button
        scale={[0.05, 0.04, 0.04]}
        position={[0, -13, 0]}
        onClick={spinSlotMachine}
      />
    </>
  );
});

export default SlotMachine;
