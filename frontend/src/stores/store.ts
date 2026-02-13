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

// Добавили (set: any)
const useGame = create<State>()(
  subscribeWithSelector((set: any) => ({
    isMobile: window.innerWidth < 768,
    setIsMobile: (value: boolean) => set(() => ({ isMobile: value })),

    modal: false,
    setModal: (isOpen: boolean) => {
      set(() => {
        return { modal: isOpen };
      });
    },

    coins: 100,
    updateCoins: (amount: number) => {
      // Добавили (state: any)
      set((state: any) => {
        const newCoins = state.coins + amount;
        return {
          coins: newCoins,
          bet: state.bet > newCoins ? newCoins : state.bet,
        };
      });
    },

    fruit0: '',
    setFruit0: (fr: Fruit | '') => {
      set(() => ({ fruit0: fr }));
    },
    fruit1: '',
    setFruit1: (fr: Fruit | '') => {
      set(() => ({ fruit1: fr }));
    },
    fruit2: '',
    setFruit2: (fr: Fruit | '') => {
      set(() => ({ fruit2: fr }));
    },

    showBars: false,
    toggleBars: () => {
      // Добавили (state: any)
      set((state: any) => ({ showBars: !state.showBars }));
    },

    bet: 1,
    updateBet: (amount: number) => {
      // Добавили (state: any)
      set((state: any) => {
        const newBet = state.bet + amount;
        const clampedBet = Math.max(1, Math.min(newBet, state.coins));
        return { bet: clampedBet };
      });
    },

    win: 0,
    setWin: (amount: number) => {
      set(() => ({ win: amount }));
    },

    spins: 0,
    addSpin: () => {
      // Добавили (state: any)
      set((state: any) => ({ spins: state.spins + 1 }));
    },

    startTime: 0,
    endTime: 0,

    phase: 'idle',
    start: () => {
      // Добавили (state: any)
      set((state: any) => {
        if (state.phase === 'idle') {
          return { phase: 'spinning', startTime: Date.now() };
        }
        return {};
      });
    },
    end: () => {
      // Добавили (state: any)
      set((state: any) => {
        if (state.phase === 'spinning') {
          const endTime = Date.now();
          const startTime = state.startTime;
          const elapsedTime = endTime - startTime;
          devLog(`Time spinning: ${elapsedTime / 1000} seconds`);
          return { phase: 'idle', endTime: endTime };
        }
        return {};
      });
    },

    firstTime: true,
    setFirstTime: (isFirstTime: boolean) => {
      set(() => ({ firstTime: isFirstTime }));
    },
  }))
);

export default useGame;
