import { useSyncExternalStore } from 'react';
import type { RoomController } from '../webrtc/RoomController';

export function useRoomState(controller: RoomController) {
  return useSyncExternalStore(
    (cb) => controller.subscribe(cb),
    () => controller.getState()
  );
}

export function useRoomStatuses(controller: RoomController) {
  return useSyncExternalStore(
    (cb) => controller.subscribeStatus(cb),
    () => controller.getAllStatuses()
  );
}
