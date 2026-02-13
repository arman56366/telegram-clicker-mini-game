import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useGame from './stores/store';
// WHEEL_SEGMENT больше не нужен, мы считаем угол точно внутри
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
    setFruit0, setFruit1, setFruit2, spins
  } = useGame((state: any) => state);

  const reelRefs = [
    useRef<ReelGroup>(null),
    useRef<ReelGroup>(null),
    useRef<ReelGroup>(null),
  ];

  // Таблица выплат (индекс фрукта -> множитель)
  // Убедись, что порядок совпадает с твоими текстурами!
  // 0: Вишня, 1: Лимон, и т.д.
  const payTable = [50, 20, 15, 10, 5, 2];
  const spinInitiated = useRef(false);

  const generateSpinResults = () => {
    // НАСТРОЙКА БАРАБАНА
    const ITEMS = 6; // Количество фруктов на текстуре
    const SEGMENT_ANGLE = (Math.PI * 2) / ITEMS; 

    const randomValue = Math.random();
    let res: number[] = [0, 0, 0];
    let prize = 0;

    // --- СЦЕНАРИЙ 1: ПОБЕДА (15% шанс) ---
    if (randomValue < 0.15) { 
      const winnerFruit = Math.floor(Math.random() * ITEMS);
      res = [winnerFruit, winnerFruit, winnerFruit];
      const multiplier = payTable[winnerFruit] || 2;
      prize = multiplier * bet;
    } 
    // --- СЦЕНАРИЙ 2: ПРОИГРЫШ (85% шанс) ---
    else {
      res[0] = Math.floor(Math.random() * ITEMS);
      res[1] = Math.floor(Math.random() * ITEMS);
      
      do {
        res[2] = Math.floor(Math.random() * ITEMS);
      } while (res[0] === res[1] && res[1] === res[2]);
    }

    // Сохраняем результаты в стор
    setFruit0(res[0]);
    setFruit1(res[1]);
    setFruit2(res[2]);

    console.log(`Результат спина: [${res}] | Приз: ${prize}`);

    // Запускаем анимацию вращения
    for (let i = 0; i < 3; i++) {
      const reel = reelRefs[i].current;
      if (reel) {
        const currentRot = reel.rotation.x;
        const fullSpins = (i + 4) * (Math.PI * 2); 
        const target = currentRot + fullSpins + (res[i] * SEGMENT_ANGLE);

        reel.targetRotationX = target;
        reel.isSnapping = false;
      }
    }

    // Таймер начисления денег
    if (prize > 0) {
      setTimeout(() => {
        setWin(prize);
        updateCoins(prize);
      }, 3500);
    }

    return prize;
  };

  const handleSpinClick = () => {
    if (phase !== 'idle' || coins < bet) return;
    start();
  };

  // Слушаем когда фаза изменилась на spinning - тогда генерируем результаты
  useEffect(() => {
    if (phase === 'spinning' && !spinInitiated.current) {
      spinInitiated.current = true;
      addSpin();
      setWin(0);
      generateSpinResults();
    }
  }, [phase, addSpin, setWin]);

  // Когда фаза вернулась на idle - сбрасываем флаг
  useEffect(() => {
    if (phase === 'idle') {
      spinInitiated.current = false;
    }
  }, [phase]);

  // Анимация кадров (loop)
  useFrame((_state, delta) => {
    let allFinished = true;
    for (let i = 0; i < reelRefs.length; i++) {
      const reel = reelRefs[i].current;
      if (!reel || reel.targetRotationX === undefined) continue;
      
      allFinished = false;
      const remaining = reel.targetRotationX - reel.rotation.x;

      if (!reel.isSnapping) {
        // Фаза быстрого вращения - постоянная скорость
        const speed = 15; // радиан/сек
        if (remaining > 0.3) { 
          reel.rotation.x += speed * delta; 
        } else { 
          reel.isSnapping = true; 
        }
      } else {
        // Фаза доводки (snap) - замедление
        reel.rotation.x = THREE.MathUtils.lerp(reel.rotation.x, reel.targetRotationX, 0.1);
        if (Math.abs(reel.rotation.x - reel.targetRotationX) < 0.01) {
          reel.rotation.x = reel.targetRotationX;
          reel.targetRotationX = undefined;
        }
      }
    }
    
    if (allFinished && phase === 'spinning') {
      end();
    }
  });

  // Управление с клавиатуры
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { 
      if (e.code === 'Space' && phase === 'idle') handleSpinClick(); 
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
      
      {/* 3D Кнопку можно скрыть, если используешь интерфейс */}
      <Button scale={[0.05, 0.04, 0.04]} position={[0, -13, 0]} onClick={handleSpinClick} />
    </>
  );
});

export default SlotMachine;
