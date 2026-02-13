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

  const payTable = [50, 20, 15, 5, 2, 1];

  const spinSlotMachine = () => {
    // ВАЖНО: Убираем проверку на фазу 'spinning' внутри этой функции, 
    // так как она теперь может вызываться, когда фаза уже изменена Interface.tsx
    if (coins < bet) return;

    // Если фаза еще не 'spinning' (нажатие через 3D кнопку или Space), запускаем её
    if (phase !== 'spinning') start(); 
    
    addSpin();
    setWin(0);

    const randomValue = Math.random();
    let res: number[] = [0, 0, 0];

    // ШАНС ВЫИГРЫША 10%
    if (randomValue < 0.1) { 
      const winnerFruit = Math.floor(Math.random() * 4); 
      res = [winnerFruit, winnerFruit, winnerFruit];
      const prize = payTable[winnerFruit] * bet;
      setTimeout(() => {
        setWin(prize);
        updateCoins(prize);
      }, 3500); 
    } 
    // ВИЗУАЛЬНЫЙ ОБМАН 40% (Near Miss)
    else if (randomValue < 0.5) {
      const sideFruit = Math.floor(Math.random() * 6);
      const middleFruit = (sideFruit + 1) % 6;
      res = [sideFruit, middleFruit, sideFruit];
    } 
    // ПРОИГРЫШ 50%
    else {
      res[0] = Math.floor(Math.random() * 6);
      res[1] = (res[0] + 1) % 6;
      res[2] = (res[1] + 1) % 6;
    }

    setFruit0(res[0]);
    setFruit1(res[1]);
    setFruit2(res[2]);

    for (let i = 0; i < 3; i++) {
      const reel = reelRefs[i].current;
      if (reel) {
        const currentRot = reel.rotation.x;
        const fullSpins = (i + 4) * Math.PI * 2; 
        const segmentOffset = res[i] * (WHEEL_SEGMENT || 0.7853);
        reel.targetRotationX = currentRot + fullSpins + segmentOffset;
        reel.isSnapping = false;
      }
    }
  };

  // ЭТОТ БЛОК СВЯЗЫВАЕТ ВАШУ КНОПКУ ИЗ INTERFACE.TSX С БАРАБАНАМИ
  useEffect(() => {
    // Проверяем, крутятся ли уже барабаны
    const isAnyReelMoving = reelRefs.some(r => r.current?.targetRotationX !== undefined);

    // Если кнопка в Interface нажала start(), фаза стала 'spinning', 
    // но физическое вращение еще не началось — запускаем его
    if (phase === 'spinning' && !isAnyReelMoving) {
      spinSlotMachine();
    }
  }, [phase]);

  useFrame((_state, delta) => {
    let allFinished = true;
    for (let i = 0; i < reelRefs.length; i++) {
      const reel = reelRefs[i].current;
      if (!reel || reel.targetRotationX === undefined) continue;
      
      allFinished = false;
      const remaining = reel.targetRotationX - reel.rotation.x;

      if (!reel.isSnapping) {
        const speed = Math.max(remaining * 4, 15) * delta;
        if (remaining > 0.1) { 
          reel.rotation.x += speed; 
        } else { 
          reel.isSnapping = true; 
        }
      } else {
        reel.rotation.x = THREE.MathUtils.lerp(reel.rotation.x, reel.targetRotationX, 0.12);
        if (Math.abs(reel.rotation.x - reel.targetRotationX) < 0.005) {
          reel.rotation.x = reel.targetRotationX;
          reel.targetRotationX = undefined;
        }
      }
    }
    
    // Завершаем фазу в сторе, когда все барабаны встали
    if (allFinished && phase === 'spinning') {
      const isActuallyMoving = reelRefs.some(r => r.current?.targetRotationX !== undefined);
      if (!isActuallyMoving) end();
    }
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { 
      if (e.code === 'Space' && phase === 'idle') spinSlotMachine(); 
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
      
      {/* 3D Кнопка (можешь удалить, если пользуешься только фиолетовой в Interface) */}
      <Button scale={[0.05, 0.04, 0.04]} position={[0, -13, 0]} onClick={spinSlotMachine} />
    </>
  );
});

export default SlotMachine;
