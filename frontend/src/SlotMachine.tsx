/*
 * Copyright (c) Michael Kolesidis <michael.kolesidis@gmail.com>
 * GNU Affero General Public License v3.0
 */

import { useRef, useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useGame from './stores/store';
import devLog from './utils/functions/devLog';
import segmentToFruit from './utils/functions/segmentToFruit';
import { WHEEL_SEGMENT } from './utils/constants';
import Reel from './Reel';
import Button from './Button';

interface ReelGroup extends THREE.Group {
  reelSpinUntil?: number;
  targetRotationX?: number;
  isSnapping?: boolean;
}

const SlotMachine = forwardRef((_props, ref) => {
  const {
    fruit0, fruit1, fruit2,
    setFruit0, setFruit1, setFruit2,
    phase, start, end, addSpin,
    coins, bet
  } = useGame((state: any) => state);

  const reelRefs = [
    useRef<ReelGroup>(null),
    useRef<ReelGroup>(null),
    useRef<ReelGroup>(null),
  ];

  const [stoppedReels, setStoppedReels] = useState(0);

  // Следим за фазой из стора. Когда Interface или Game переключают фазу, запускаем анимацию здесь.
  useEffect(() => {
    if (phase === 'spinning') {
      devLog('SlotMachine: Animation Started');
      setStoppedReels(0);
      addSpin();

      // Устанавливаем параметры вращения для каждого барабана
      for (let i = 0; i < 3; i++) {
        const reel = reelRefs[i].current;
        if (reel) {
          reel.rotation.x = 0;
          // Генерируем случайное количество оборотов для визуального эффекта
          const stopSegment = Math.floor(Math.random() * 20) + 20; 
          reel.reelSpinUntil = stopSegment;
          reel.targetRotationX = stopSegment * WHEEL_SEGMENT;
          reel.isSnapping = false;
        }
      }
    }
  }, [phase]);

  useFrame(() => {
    for (let i = 0; i < reelRefs.length; i++) {
      const reel = reelRefs[i].current;
      if (!reel || reel.reelSpinUntil === undefined || reel.targetRotationX === undefined) continue;

      const rotationSpeed = 0.15; // Скорость вращения

      if (!reel.isSnapping) {
        if (reel.rotation.x < reel.targetRotationX - rotationSpeed) {
          reel.rotation.x += rotationSpeed;
        } else {
          reel.isSnapping = true;
        }
      }

      if (reel.isSnapping) {
        reel.rotation.x = THREE.MathUtils.lerp(reel.rotation.x, reel.targetRotationX, 0.1);

        if (Math.abs(reel.rotation.x - reel.targetRotationX) < 0.01) {
          reel.rotation.x = reel.targetRotationX;
          
          // ЗАЩИТА: проверяем, что segmentToFruit вернул значение
          const fruit = segmentToFruit(i, reel.reelSpinUntil) || 0;
          
          // Больше не ставим пустые строки! Только индексы из функции.
          if (i === 0) setFruit0(fruit);
          if (i === 1) setFruit1(fruit);
          if (i === 2) setFruit2(fruit);

          reel.reelSpinUntil = undefined;
          reel.isSnapping = false;

          setStoppedReels((prev) => {
            const newStopped = prev + 1;
            // Когда последний барабан встал, Game.tsx уже обработает выигрыш через стор
            if (newStopped === 3) {
              devLog('SlotMachine: All reels stopped');
              // end() вызовется автоматически в Game.tsx по таймеру
            }
            return newStopped;
          });
        }
      }
    }
  });

  useImperativeHandle(ref, () => ({ reelRefs }));

  const [buttonZ, setButtonZ] = useState(0);
  const [buttonY, setButtonY] = useState(-13);

  return (
    <>
      <Reel ref={reelRefs[0]} map={0} position={[-7, 0, 0]} scale={[10, 10, 10]} reelSegment={0} />
      <Reel ref={reelRefs[1]} map={1} position={[0, 0, 0]} scale={[10, 10, 10]} reelSegment={0} />
      <Reel ref={reelRefs[2]} map={2} position={[7, 0, 0]} scale={[10, 10, 10]} reelSegment={0} />
      
      <Button
        scale={[0.055, 0.045, 0.045]}
        position={[0, buttonY, buttonZ]}
        rotation={[-Math.PI / 8, 0, 0]}
        onClick={() => {
          if (phase === 'idle' && coins >= bet) {
            start(); // Метод из стора сам спишет деньги и сменит фазу
          }
        }}
        onPointerDown={() => { setButtonZ(-1); setButtonY(-13.5); }}
        onPointerUp={() => { setButtonZ(0); setButtonY(-13); }}
      />
    </>
  );
});

export default SlotMachine;
