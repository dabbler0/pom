import { useEffect } from 'react';
import type { Block } from '../types';
import { drawFaviconClock, resetFavicon } from '../favicon';

export function useFaviconClock(block: Block | undefined, now: number) {
  useEffect(() => {
    if (block) {
      drawFaviconClock(block, now);
    } else {
      resetFavicon();
    }
  }, [block, now]);

  useEffect(() => resetFavicon, []);
}
