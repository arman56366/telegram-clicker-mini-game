import { useRef, useEffect, forwardRef, useImperativeHandle, useCallback, createRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useGame from './stores/store';
import Reel from './Reel';
import Button from './Button';

interface ReelGroup extends THREE.Group {
  targetRotationX?: number;
  stopDelay?: number;
  elapsedTime?: number;
}

interface SlotMachineHandle {
  reelRefs: React.RefObject<ReelGroup | null>[];
}

const ITEMS = 6;
const SEGMENT_ANGLE = (Math.PI * 2) / ITEMS;

// ⚠ если будет лёгкое смещение — поменяй 1.57 на 1.55–1.6
const MODEL_OFFSET = Math.PI / 2;

const SlotMachine = forwardRef<SlotMachineHandle>((_props, ref) => {
  const {
    phase,
    start,
    end,
    addSpin,
    bet,
    coins,
    updateCoins,
    setWin,
    setFruit0,
    setFruit1,
    setFruit2
  } = useGame((state: any) => state);

  const reelRefs = useRef([
    createRef<ReelGroup>(),
    createRef<ReelGroup>(),
    createRef<ReelGroup>(),
  ]).current;

  const spinInitiated = useRef(false);
  const phaseRef = useRef(phase);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const payTable = [50, 20, 15, 10, 5, 2];

  // 🎰 Генерация результатов
  const generateSpinResults = useCallback(() => {
    const randomValue = Math.random();
    let res: number[] = [0, 0, 0];
    let prize = 0;

    if (randomValue < 0.15) {
      const winner = Math.floor(Math.random() * ITEMS);
      res = [winner, winner, winner];
      prize = (payTable[winner] || 2) * bet;
    } else {
      res[0] = Math.floor(Math.random() * ITEMS);
      res[1] = Math.floor(Math.random() * ITEMS);

      do {
        res[2] = Math.floor(Math.random() * ITEMS);
      } while (res[0] === res[1] && res[1] === res[2]);
    }

    setFruit0(res[0]);
    setFruit1(res[1]);
    setFruit2(res[2]);

    // 🎯 Запуск вращения
    for (let i = 0; i < 3; i++) {
      const reel = reelRefs[i].current;
      if (!reel) continue;

      const fullSpins = (4 + i) * (Math.PI * 2);

      const target =
        fullSpins +
        (res[i] * SEGMENT_ANGLE) +
        (SEGMENT_ANGLE / 2) +
        MODEL_OFFSET;

      reel.targetRotationX = target;
      reel.stopDelay = i * 400;
      reel.elapsedTime = 0;
    }

    if (prize > 0) {
      setTimeout(() => {
        setWin(prize);
        updateCoins(prize);
      }, 4200);
    }
  }, [bet, setFruit0, setFruit1, setFruit2, setWin, updateCoins, payTable]);

  const handleSpinClick = useCallback(() => {
    if (phase !== 'idle' || coins < bet) return;
    start();
  }, [phase, coins, bet, start]);

  // 🎬 Запуск спина при смене фазы
  useEffect(() => {
    if (phase === 'spinning' && !spinInitiated.current) {
      spinInitiated.current = true;
      addSpin();
      setWin(0);
      generateSpinResults();
    }

    if (phase === 'idle') {
      spinInitiated.current = false;
    }
  }, [phase, addSpin, setWin, generateSpinResults]);

  // 🎥 Анимация
  useFrame((_state, delta) => {
    let active = false;

    for (let i = 0; i < reelRefs.length; i++) {
      const reel = reelRefs[i].current;
      if (!reel || reel.targetRotationX === undefined) continue;

      active = true;

      reel.elapsedTime! += delta * 1000;

      if (reel.elapsedTime! < (reel.stopDelay || 0)) {
        reel.rotation.x += 18 * delta;
        continue;
      }

      const diff = reel.targetRotationX - reel.rotation.x;

      if (Math.abs(diff) > 0.5) {
        reel.rotation.x += 20 * delta;
      } else if (Math.abs(diff) > 0.01) {
        reel.rotation.x = THREE.MathUtils.lerp(
          reel.rotation.x,
          reel.targetRotationX,
          0.1
        );
      } else {
        reel.rotation.x = reel.targetRotationX;
        reel.targetRotationX = undefined;
      }
    }

    if (!active && phaseRef.current === 'spinning') {
      end();
    }
  });

  // ⌨ управление пробелом
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && phase === 'idle') {
        handleSpinClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, coins, bet, start]);

  useImperativeHandle(ref, () => ({ reelRefs }));

  return (
    <>
      <Reel ref={reelRefs[0]} map={0} position={[-7, 0, 0]} scale={[10, 10, 10]} />
      <Reel ref={reelRefs[1]} map={1} position={[0, 0, 0]} scale={[10, 10, 10]} />
      <Reel ref={reelRefs[2]} map={2} position={[7, 0, 0]} scale={[10, 10, 10]} />

      <Button
        scale={[0.05, 0.04, 0.04]}
        position={[0, -13, 0]}
        onClick={handleSpinClick}
      />
    </>
  );
});

export default SlotMachine;
