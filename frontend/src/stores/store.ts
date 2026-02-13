/*
 * Copyright (c) Michael Kolesidis <michael.kolesidis@gmail.com>
 * GNU Affero General Public License v3.0
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import devLog from '../utils/functions/devLog';
import { Fruit } from '../utils/enums';

type State = {
  isMobile: boolean;
  setIsMobile: (value: boolean) => void;
  modal: boolean;
  setModal: (isOpen: boolean) => void;
  coins: number;
  updateCoins: (amount: number) => void;
  // Изменили тип: теперь это строго число (индекс фрукта)
  fruit0: number; 
  setFruit0: (fr: number) => void;
  fruit1: number;
  setFruit1: (fr: number) => void;
  fruit2: number;
  setFruit2: (fr: number) => void;
  showBars: boolean;
  toggleBars: () => void;
  bet: number;
  updateBet: (amount: number) => void;
  win: number;
  setWin: (amount: number) => void;
  spins: number;
  addSpin: () => void;
  startTime: number;
  endTime: number;
  phase: 'idle' | 'spinning';
  start: () => void;
  end: () => void;
  firstTime: boolean;
  setFirstTime: (isFirstTime: boolean) => void;
};

const useGame = create<State>()(
  subscribeWithSelector((set: any) => ({
    isMobile: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
    setIsMobile: (value: boolean) => set(() => ({ isMobile: value })),

    modal: false,
    setModal: (isOpen: boolean) => {
      set(() => ({ modal: isOpen }));
    },

    coins: 100,
    updateCoins: (amount: number) => {
      set((state: any) => {
        const newCoins = state.coins + amount;
        return {
          coins: newCoins,
          // Если денег стало меньше, чем текущая ставка, понижаем ставку
          bet: state.bet > newCoins ? Math.max(1, newCoins) : state.bet,
        };
      });
    },

    // НАЧАЛЬНЫЕ ЗНАЧЕНИЯ ТЕПЕРЬ 0 (ЧИСЛА), А НЕ ПУСТЫЕ СТРОКИ
    fruit0: 0,
    setFruit0: (fr: number) => set(() => ({ fruit0: fr })),
    fruit1: 0,
    setFruit1: (fr: number) => set(() => ({ fruit1: fr })),
    fruit2: 0,
    setFruit2: (fr: number) => set(() => ({ fruit2: fr })),

    showBars: false,
    toggleBars: () => set((state: any) => ({ showBars: !state.showBars })),

    bet: 1,
    updateBet: (amount: number) => {
      set((state: any) => {
        const newBet = state.bet + amount;
        const clampedBet = Math.max(1, Math.min(newBet, state.coins));
        return { bet: clampedBet };
      });
    },

    win: 0,
    setWin: (amount: number) => set(() => ({ win: amount })),

    spins: 0,
    addSpin: () => set((state: any) => ({ spins: state.spins + 1 })),

    startTime: 0,
    endTime: 0,

    phase: 'idle',

    start: () => {
      set((state: any) => {
        if (state.phase !== 'idle' || state.coins < state.bet) {
          return {};
        }

        return { 
          phase: 'spinning', 
          startTime: Date.now(),
          coins: state.coins - state.bet,
          win: 0 // Сбрасываем старый выигрыш перед началом
        };
      });
    },

    end: () => {
      set((state: any) => {
        if (state.phase === 'spinning') {
          const endTime = Date.now();
          devLog(`Spin ended. Duration: ${(endTime - state.startTime) / 1000}s`);
          return { phase: 'idle', endTime: endTime };
        }
        return {};
      });
    },

    firstTime: true,
    setFirstTime: (isFirstTime: boolean) => set(() => ({ firstTime: isFirstTime })),
  }))
);

export default useGame;
