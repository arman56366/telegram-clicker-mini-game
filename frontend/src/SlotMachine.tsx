/*
 * Copyright (c) Michael Kolesidis <michael.kolesidis@gmail.com>
 * GNU Affero General Public License v3.0
 */

import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
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

  // Таблица выплат на основе загруженного изображения:
  // 0-Cherry(50), 1-Apple(20), 2-Banana(15), 3-Orange(5), 4-Lemon(2), 5-Grape(1)
  const payTable = [50, 20, 15, 5, 2, 1];

  const spinSlotMachine = () => {
    // Проверка условий запуска и списание ставки
    if (phase === 'spinning' || coins < bet) return;

    start(); 
    addSpin();
    setWin(0); // Обнуляем выигрыш перед началом

    const randomValue = Math.random();
    let res: number[] = [0, 0, 0];

    // --- ЛОГИКА ШАНСОВ И ВЕРОЯТНОСТЕЙ ---
    if (randomValue < 0.1) { 
      // 1. ПОБЕДА (10%): Все три барабана совпадают
      const winnerFruit = Math.floor(Math.random() * 4); 
      res = [winnerFruit, winnerFruit, winnerFruit];
      
      const prize = (payTable[winnerFruit] || 1) * bet;
      
      // Начисляем монеты после завершения анимации
      setTimeout(() => {
        setWin(prize);
        updateCoins(prize);
      }, 3500); 

    } else if (randomValue < 0.5) {
      // 2. ВИЗУАЛЬНЫЙ ОБМАН (40%): Первый и третий совпадают, средний - нет
      const sideFruit = Math.floor(Math.random() * 6);
      const middleFruit = (sideFruit + 1 + Math.floor(Math.random() * 3)) % 6;
      res = [sideFruit, middleFruit, sideFruit];

    } else {
      // 3. ПОЛНЫЙ ПРОИГРЫШ (50%): Разные символы
      res[0] = Math.floor(Math.random() * 6);
      res[1] = (res[0] + 1) % 6; 
      res[2] = (res[1] + 1 + Math.floor(Math.random() * 2)) % 6;
    }

    // Сохраняем индексы в стор (синхронизация с 2D UI)
    setFruit0(res[0]);
    setFruit1(res[1]);
    setFruit2(res[2]);

    // --- НАСТРОЙКА ВРАЩЕНИЯ ---
    for (let i = 0; i < 3; i++) {
      const reel = reelRefs[i].current;
      if (reel) {
        const currentRot = reel.rotation.x;
        // Каждому барабану добавляем обороты для каскадной остановки
        const fullSpins = (i + 4) * Math.PI * 2; 
        const segmentOffset = res[i] * (WHEEL_SEGMENT || 0.785398);
        
        reel.targetRotationX = currentRot + fullSpins + segmentOffset;
        reel.isSnapping = false;
      }
    }
  };

  useFrame((_state, delta) => {
    let allFinished = true;

    for (let i = 0; i < reelRefs.length; i++) {
      const reel = reelRefs[i].current;
      if (!reel || reel.targetRotationX === undefined) continue;

      allFinished = false;
      const remaining = reel.targetRotationX - reel.rotation.x;

      if (!reel.isSnapping) {
        // Скорость на основе delta для стабильности FPS
        const speed = Math.max(remaining * 4, 15) * delta;
        
        if (remaining > 0.1) {
          reel.rotation.x += speed;
        } else {
          reel.isSnapping = true;
        }
      } else {
        // Плавная фиксация на нужном фрукте
        reel.rotation.x = THREE.MathUtils.lerp(reel.rotation.x, reel.targetRotationX, 0.12);
        
        if (Math.abs(reel.rotation.x - reel.targetRotationX) < 0.005) {
          reel.rotation.x = reel.targetRotationX;
          reel.targetRotationX = undefined;
        }
      }
    }

    // Завершаем фазу спина, когда все барабаны замерли
    if (allFinished && phase === 'spinning') {
      end();
    }
  });

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
      <Reel ref={reelRefs[0]} map={0} position={[-7, 0, 0]} scale={[10, 10, 10]} />
      <Reel ref={reelRefs[1]} map={1} position={[0, 0, 0]} scale={[10, 10, 10]} />
      <Reel ref={reelRefs[2]} map={2} position={[7, 0, 0]} scale={[10, 10, 10]} />
      
      <Button
        scale={[0.05, 0.04, 0.04]}
        position={[0, -13, 0]}
        onClick={spinSlotMachine}
      />
    </>
  );
});

export default SlotMachine;
