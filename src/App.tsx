import { useMemo, useState } from 'react';
import { Landing } from './components/Landing';
import { HostSetup } from './components/HostSetup';
import { JoinSetup } from './components/JoinSetup';
import { RoomView } from './components/RoomView';
import { RoomController } from './webrtc/RoomController';

type Route =
  | { screen: 'landing' }
  | { screen: 'host-setup' }
  | { screen: 'join-setup' }
  | { screen: 'room'; controller: RoomController; guestResponseCode?: string };

function initialJoinCode(): string | undefined {
  const hash = window.location.hash;
  const match = /#join=(.+)/.exec(hash);
  return match ? decodeURIComponent(match[1]) : undefined;
}

function App() {
  const [route, setRoute] = useState<Route>(() =>
    initialJoinCode() ? { screen: 'join-setup' } : { screen: 'landing' }
  );
  const prefillJoinCode = useMemo(initialJoinCode, []);

  return (
    <main className="app">
      {route.screen === 'landing' && (
        <Landing onHost={() => setRoute({ screen: 'host-setup' })} onJoin={() => setRoute({ screen: 'join-setup' })} />
      )}

      {route.screen === 'host-setup' && (
        <HostSetup
          onBack={() => setRoute({ screen: 'landing' })}
          onSubmit={({ hostName, workMinutes, breakMinutes, iterations }) => {
            const controller = RoomController.createHost(hostName, {
              startTime: Date.now(),
              workMinutes,
              breakMinutes,
              iterations,
            });
            setRoute({ screen: 'room', controller });
          }}
        />
      )}

      {route.screen === 'join-setup' && (
        <JoinSetup
          initialCode={prefillJoinCode}
          onBack={() => setRoute({ screen: 'landing' })}
          onSubmit={async ({ guestName, inviteCode }) => {
            const controller = RoomController.createGuestPlaceholder(guestName);
            const responseCode = await controller.createJoinResponse(inviteCode);
            setRoute({ screen: 'room', controller, guestResponseCode: responseCode });
          }}
        />
      )}

      {route.screen === 'room' && (
        <RoomView controller={route.controller} guestResponseCode={route.guestResponseCode} />
      )}
    </main>
  );
}

export default App;
