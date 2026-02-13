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
    setFruit0, setFruit1, setFruit2
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

  const spinSlotMachine = () => {
    // 1. Проверки перед стартом
    if (coins < bet) return;
    if (phase !== 'spinning') start(); 
    
    // 2. Списываем ставку
    addSpin();
    setWin(0);

    // ==========================================
    // НАСТРОЙКА БАРАБАНА
    // ==========================================
    const ITEMS = 6; // Количество фруктов на текстуре
    // Угол одного сектора (360 / 6 = 60 градусов или ~1.047 радиан)
    const SEGMENT_ANGLE = (Math.PI * 2) / ITEMS; 

    const randomValue = Math.random();
    let res: number[] = [0, 0, 0];
    let prize = 0;

    // --- СЦЕНАРИЙ 1: ПОБЕДА (15% шанс) ---
    if (randomValue < 0.15) { 
      // Выбираем случайный выигрышный фрукт (от 0 до 5)
      const winnerFruit = Math.floor(Math.random() * ITEMS);
      res = [winnerFruit, winnerFruit, winnerFruit];
      
      // Считаем приз
      const multiplier = payTable[winnerFruit] || 2; // фолбек на x2
      prize = multiplier * bet;
    } 
    // --- СЦЕНАРИЙ 2: ПРОИГРЫШ (85% шанс) ---
    else {
      // Генерируем два случайных
      res[0] = Math.floor(Math.random() * ITEMS);
      res[1] = Math.floor(Math.random() * ITEMS);
      
      // Генерируем третий, но ПРОВЕРЯЕМ, чтобы не было случайной победы
      do {
        res[2] = Math.floor(Math.random() * ITEMS);
      } while (res[0] === res[1] && res[1] === res[2]); // Повторяем, если случайно выпал джекпот
    }

    // Сохраняем результаты в стор
    setFruit0(res[0]);
    setFruit1(res[1]);
    setFruit2(res[2]);

    console.log(`Результат спина: [${res}] | Приз: ${prize}`);

    // ==========================================
    // ЗАПУСК ВРАЩЕНИЯ
    // ==========================================
    for (let i = 0; i < 3; i++) {
      const reel = reelRefs[i].current;
      if (reel) {
        const currentRot = reel.rotation.x;
        
        // 4 полных оборота + индекс * угол
        const fullSpins = (i + 4) * (Math.PI * 2); 
        
        // ВАЖНО: res[i] * SEGMENT_ANGLE поворачивает точно на нужный сектор.
        // Если картинка стоит криво, добавь здесь "+ (SEGMENT_ANGLE / 2)"
        const target = currentRot + fullSpins + (res[i] * SEGMENT_ANGLE);

        reel.targetRotationX = target;
        reel.isSnapping = false;
      }
    }

    // Таймер начисления денег (синхронно с остановкой барабанов)
    if (prize > 0) {
      setTimeout(() => {
        setWin(prize);
        updateCoins(prize);
      }, 3500); // 3.5 секунды анимации
    }
  };

  // Связь с интерфейсом (кнопка в UI)
  useEffect(() => {
    const isAnyReelMoving = reelRefs.some(r => r.current?.targetRotationX !== undefined);
    if (phase === 'spinning' && !isAnyReelMoving) {
      spinSlotMachine();
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
        // Фаза быстрого вращения
        const speed = Math.max(remaining * 5, 15) * delta;
        if (remaining > 0.1) { 
          reel.rotation.x += speed; 
        } else { 
          reel.isSnapping = true; 
        }
      } else {
        // Фаза доводки (snap)
        reel.rotation.x = THREE.MathUtils.lerp(reel.rotation.x, reel.targetRotationX, 0.15);
        if (Math.abs(reel.rotation.x - reel.targetRotationX) < 0.005) {
          reel.rotation.x = reel.targetRotationX;
          reel.targetRotationX = undefined;
        }
      }
    }
    
    if (allFinished && phase === 'spinning') {
      const isActuallyMoving = reelRefs.some(r => r.current?.targetRotationX !== undefined);
      if (!isActuallyMoving) end();
    }
  });

  // Управление с клавиатуры
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
      
      {/* 3D Кнопку можно скрыть, если используешь интерфейс */}
      <Button scale={[0.05, 0.04, 0.04]} position={[0, -13, 0]} onClick={spinSlotMachine} />
    </>
  );
});

export default SlotMachine;
