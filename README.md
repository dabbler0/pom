# 🍅 pom

A serverless pomodoro-method task tracker. It's a static TypeScript/React web app —
no backend, no signaling server — hosted for free on GitHub Pages.

Live at: https://dabbler0.github.io/pom/

## What it does

**Host a room.** Pick a work duration, break duration, and number of iterations.
You immediately get a schedule table (work, break, work, break, …) starting from
now, with an animated countdown ring for whichever block is currently active.
Rows are greyed out once they're in the past. Fill in an intention for each of
your work blocks.

**Invite others.** Generate an invite link (or raw invite code) and send it to
someone however you like — chat, email, whatever. There's no server relaying
anything: the invite link *is* a WebRTC offer, base64-encoded. Opening it lets
your friend generate a response key (a WebRTC answer), which they send back to
you. Once you paste that into the host's page, the two browsers connect
directly over a WebRTC data channel. Each connected person gets their own
column in the table, edits their own intentions, and sees everyone else's
edits live.

Because there's no signaling server, connectivity depends on both sides being
reachable via public STUN (`stun.l.google.com`) — this covers most home/office
networks, but there's no TURN fallback, so it can fail behind strict symmetric
NATs.

## Development

```bash
npm install
npm run dev
```

```bash
npm run build    # type-checks and builds the static site into dist/
npm run preview  # serve the production build locally
```

## Architecture

- `src/timer.ts` — pure schedule math (given a start time + config, compute
  work/break blocks and which one is "current").
- `src/webrtc/` — signaling (offer/answer base64 encode/decode, waiting for
  ICE gathering to finish since there's no trickle-ICE relay) and
  `RoomController`, which owns a host-authoritative star topology: the host
  holds canonical state and relays every edit to all connected guests.
- `src/components/` — UI: landing screen, host setup, join flow, the invite
  panel, the schedule table, and the countdown clock.

## Deployment

Pushing to `main` (or the active dev branch) triggers
`.github/workflows/deploy.yml`, which builds the app and publishes `dist/` via
GitHub Pages' official Actions-based deployment.
