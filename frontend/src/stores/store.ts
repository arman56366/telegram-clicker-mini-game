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
  fruit0: Fruit | '';
  setFruit0: (fr: Fruit | '') => void;
  fruit1: Fruit | '';
  setFruit1: (fr: Fruit | '') => void;
  fruit2: Fruit | '';
  setFruit2: (fr: Fruit | '') => void;
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
    isMobile: window.innerWidth < 768,
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
          bet: state.bet > newCoins ? Math.max(1, newCoins) : state.bet,
        };
      });
    },

    fruit0: '',
    setFruit0: (fr: Fruit | '') => set(() => ({ fruit0: fr })),
    fruit1: '',
    setFruit1: (fr: Fruit | '') => set(() => ({ fruit1: fr })),
    fruit2: '',
    setFruit2: (fr: Fruit | '') => set(() => ({ fruit2: fr })),

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
    /**
     * ИСПРАВЛЕННАЯ ФУНКЦИЯ START
     * Теперь она сама проверяет баланс и списывает ставку ОДИН раз
     */
    start: () => {
      set((state: any) => {
        // Проверяем: если уже крутимся или денег меньше ставки — отменяем
        if (state.phase !== 'idle' || state.coins < state.bet) {
          return {};
        }

        // Списываем ставку и меняем фазу
        return { 
          phase: 'spinning', 
          startTime: Date.now(),
          coins: state.coins - state.bet 
        };
      });
    },

    end: () => {
      set((state: any) => {
        if (state.phase === 'spinning') {
          const endTime = Date.now();
          devLog(`Time spinning: ${(endTime - state.startTime) / 1000}s`);
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
