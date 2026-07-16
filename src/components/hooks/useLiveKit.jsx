import { useState, useRef, useCallback, useEffect } from "react";
import {
  Room,
  RoomEvent,
  Track,
  ConnectionState,
  DataPacket_Kind,
  DisconnectReason,
  setLogLevel,
} from "livekit-client";

setLogLevel("warn");

export function useLiveKit() {
  const roomRef = useRef(null);
  const connectPromiseRef = useRef(null);

  const [connectionState, setConnectionState] = useState(
    ConnectionState.Disconnected
  );

  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [localScreenTrack, setLocalScreenTrack] = useState(null);

  const [remoteTracks, setRemoteTracks] = useState({});

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isScreenShareSupported, setIsScreenShareSupported] = useState(false);
  const [remoteParticipantCount, setRemoteParticipantCount] = useState(0);

  // Per-participant mic-mute state + raised hands (group calls)
  const [mutedMic, setMutedMic] = useState({});      // { identity: true } when mic muted
  const [raisedHands, setRaisedHands] = useState({}); // { identity: true } when hand raised
  const [isHandRaised, setIsHandRaised] = useState(false); // local user's own hand
  const [activeSpeakers, setActiveSpeakers] = useState([]); // identities currently speaking
  const [localIdentity, setLocalIdentity] = useState("");   // this client's identity
  // true when the SERVER ended us (host removed us / room deleted) — the
  // client should leave the page immediately, not show "Reconnecting…".
  const [wasRemoved, setWasRemoved] = useState(false);

  useEffect(() => {
    setIsScreenShareSupported(
      !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia)
    );
  }, []);

  // ───────── ROSTER REBUILD ─────────
  // Single source of truth: rebuild the whole remote roster straight from
  // room.remoteParticipants. Idempotent + race-free — every connected
  // participant always gets an entry (even with cam+mic off), and every
  // published track is re-attached and subscribed. Called on every relevant
  // event so what one user sees never depends on event ordering.
  const rebuildFromRoom = useCallback((room) => {
    if (!room) return;

    const nextTracks = {};
    const nextMuted = {};

    room.remoteParticipants?.forEach((p) => {
      const entry = { name: p.name || p.identity };

      p.trackPublications?.forEach((pub) => {
        const isScreen =
          pub.source === Track.Source.ScreenShare ||
          pub.source === Track.Source.ScreenShareAudio;
        const track = pub.track || null;
        const kind = pub.kind || pub.track?.kind;

        if (kind === "video") {
          if (isScreen) entry.screen = track;
          else entry.video = track;
        } else if (kind === "audio") {
          if (isScreen) {
            entry.screenAudio = track;
          } else {
            entry.audio = track;
            if (pub.source === Track.Source.Microphone) {
              nextMuted[p.identity] = pub.isMuted;
            }
          }
        }

        // Make sure we're subscribed to everything (safety net).
        if (!pub.isSubscribed) {
          try { pub.setSubscribed(true); } catch { /* in progress */ }
        }
      });

      nextTracks[p.identity] = entry;
    });

    setRemoteTracks(nextTracks);
    setMutedMic(nextMuted);
    setRemoteParticipantCount(room.remoteParticipants?.size || 0);
  }, []);

  // ───────── CONNECT ─────────
  // opts: { cam?: boolean, mic?: boolean } — initial device state chosen on
  // the pre-join screen. Defaults to both on.
  const connect = useCallback(async (livekitUrl, livekitToken, opts = {}) => {
    if (connectPromiseRef.current) return connectPromiseRef.current;
    const wantCam = opts.cam !== false;
    const wantMic = opts.mic !== false;

    const promise = (async () => {
      const room = new Room({
        // adaptiveStream pauses video for tiles it thinks are off-screen/small,
        // which made remote video appear only after a delay in the gallery.
        // Off = every subscribed video streams immediately (fine for ≤10).
        adaptiveStream: false,
        dynacast: true,
        stopLocalTrackOnUnpublish: true,
      });

      // CONNECTION STATE
      room.on(RoomEvent.ConnectionStateChanged, (state) => {
        setConnectionState(state);
      });

      // SERVER-INITIATED DISCONNECT — host removed us / room closed. Signal the
      // page to exit rather than sitting on "Reconnecting…".
      room.on(RoomEvent.Disconnected, (reason) => {
        if (
          reason === DisconnectReason.PARTICIPANT_REMOVED ||
          reason === DisconnectReason.ROOM_DELETED ||
          reason === DisconnectReason.SERVER_SHUTDOWN
        ) {
          setWasRemoved(true);
        }
      });

      // TRACK EVENTS — rebuild the whole roster from the room each time.
      room.on(RoomEvent.TrackSubscribed, () => rebuildFromRoom(room));
      room.on(RoomEvent.TrackUnsubscribed, () => rebuildFromRoom(room));

      // MUTE STATE — reflect mic mute/unmute (remote tiles + local, incl. host force-mute)
      room.on(RoomEvent.TrackMuted, (pub, participant) => {
        if (pub.source === Track.Source.Microphone) {
          setMutedMic((prev) => ({ ...prev, [participant.identity]: true }));
          if (participant.isLocal) setIsMicOn(false);
        }
      });
      room.on(RoomEvent.TrackUnmuted, (pub, participant) => {
        if (pub.source === Track.Source.Microphone) {
          setMutedMic((prev) => ({ ...prev, [participant.identity]: false }));
          if (participant.isLocal) setIsMicOn(true);
        }
      });

      // ACTIVE SPEAKERS — highlight whoever is talking
      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        setActiveSpeakers((speakers || []).map((p) => p.identity));
      });

      // DATA CHANNEL — raise-hand + host "lower all hands" signalling
      room.on(RoomEvent.DataReceived, (payload, participant) => {
        try {
          const msg = JSON.parse(new TextDecoder().decode(payload));
          if (msg.type === "raise_hand" && participant?.identity) {
            setRaisedHands((prev) => ({ ...prev, [participant.identity]: !!msg.raised }));
          } else if (msg.type === "lower_all_hands") {
            setRaisedHands({});
            setIsHandRaised(false);
          }
        } catch { /* ignore malformed data */ }
      });

      room.on(RoomEvent.TrackPublished, async (publication) => {
        // Subscribe to the new track, then rebuild.
        if (!publication.isSubscribed) {
          try { await publication.setSubscribed(true); } catch { /* auto-subscribe may handle it */ }
        }
        rebuildFromRoom(room);
      });
      room.on(RoomEvent.TrackUnpublished, () => rebuildFromRoom(room));

      room.on(RoomEvent.ParticipantConnected, (participant) => {
        // Show them right away — even if they joined with cam+mic off.
        rebuildFromRoom(room);
      });

      room.on(RoomEvent.ParticipantDisconnected, (participant) => {
        rebuildFromRoom(room);
        setRaisedHands((prev) => {
          const updated = { ...prev };
          delete updated[participant.identity];
          return updated;
        });
      });

      // LOCAL TRACKS
      room.on(RoomEvent.LocalTrackPublished, (publication) => {
        if (publication.source === Track.Source.Camera) {
          setLocalVideoTrack(publication.track || null);
          setIsCamOn(true);
        }
        if (publication.source === Track.Source.Microphone) {
          setIsMicOn(true);
        }
        if (publication.source === Track.Source.ScreenShare) {
          setIsScreenSharing(true);
          setLocalScreenTrack(publication.track || null);
        }
      });

      room.on(RoomEvent.LocalTrackUnpublished, (publication) => {
        if (publication.source === Track.Source.Camera) {
          setLocalVideoTrack(null);
          setIsCamOn(false);
        }
        if (publication.source === Track.Source.Microphone) {
          setIsMicOn(false);
        }
        if (publication.source === Track.Source.ScreenShare) {
          setIsScreenSharing(false);
          setLocalScreenTrack(null);
        }
      });

      // CONNECT
      try {
        await room.connect(livekitUrl.trim(), livekitToken.trim());

        try {
          await room.localParticipant.setCameraEnabled(wantCam);
          if (wantCam) {
            const camPub = room.localParticipant.getTrack(Track.Source.Camera);
            if (camPub?.track) setLocalVideoTrack(camPub.track);
          } else {
            setLocalVideoTrack(null);
          }
          setIsCamOn(wantCam);
        } catch (camErr) {
          console.warn("Camera failed or not found:", camErr);
          setIsCamOn(false);
        }

        try {
          await room.localParticipant.setMicrophoneEnabled(wantMic);
          setIsMicOn(wantMic);
        } catch (micErr) {
          console.warn("Microphone failed or not found:", micErr);
          setIsMicOn(false);
        }

        roomRef.current = room;
        setLocalIdentity(room.localParticipant.identity);

        // Build the roster from whoever is already in the room, then re-sync a
        // few times to catch anyone whose state arrived slightly late (races).
        rebuildFromRoom(room);
        [400, 1200, 2500].forEach((ms) =>
          setTimeout(() => {
            if (roomRef.current === room) rebuildFromRoom(room);
          }, ms)
        );

        setIsMicOn(room.localParticipant.isMicrophoneEnabled);
        setIsCamOn(room.localParticipant.isCameraEnabled);

        return room;
      } catch (err) {
        connectPromiseRef.current = null;
        try {
          await room.disconnect();
        } catch { /* cleanup best-effort */ }
        throw err;
      }
    })();

    connectPromiseRef.current = promise;
    return promise;
  }, [rebuildFromRoom]);

  // ───────── CONTROLS ─────────
  const toggleMic = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !room.localParticipant.isMicrophoneEnabled;
    await room.localParticipant.setMicrophoneEnabled(next);
    setIsMicOn(next);
  }, []);

  const toggleCamera = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;

    const next = !room.localParticipant.isCameraEnabled;
    await room.localParticipant.setCameraEnabled(next);
    setIsCamOn(next);

    if (!next) {
      setLocalVideoTrack(null);
    } else {
      const camPub = room.localParticipant.getTrack(Track.Source.Camera);
      if (camPub?.track) setLocalVideoTrack(camPub.track);
    }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;

    try {
      const next = !room.localParticipant.isScreenShareEnabled;
      await room.localParticipant.setScreenShareEnabled(next);
      setIsScreenSharing(next);
    } catch (err) {
      console.error("Failed to toggle screen share:", err);
      // On mobile/unsupported browsers, this will throw
      setIsScreenSharing(false);
      throw err;
    }
  }, []);

  const toggleRaiseHand = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !isHandRaised;
    setIsHandRaised(next);
    try {
      const data = new TextEncoder().encode(
        JSON.stringify({ type: "raise_hand", raised: next })
      );
      // livekit-client v1: publishData(data, kind) — kind is DataPacket_Kind,
      // NOT an options object. RELIABLE ensures delivery to all participants.
      await room.localParticipant.publishData(data, DataPacket_Kind.RELIABLE);
    } catch (err) {
      console.error("Failed to send raise-hand:", err);
    }
  }, [isHandRaised]);

  const lowerAllHands = useCallback(async () => {
    const room = roomRef.current;
    setRaisedHands({});
    setIsHandRaised(false);
    if (!room) return;
    try {
      const data = new TextEncoder().encode(
        JSON.stringify({ type: "lower_all_hands" })
      );
      await room.localParticipant.publishData(data, DataPacket_Kind.RELIABLE);
    } catch (err) {
      console.error("Failed to send lower-all-hands:", err);
    }
  }, []);

  const disconnect = useCallback(async () => {
    const pending = connectPromiseRef.current;
    connectPromiseRef.current = null;

    if (pending) {
      try {
        await pending;
      } catch {}
    }

    const room = roomRef.current;
    roomRef.current = null;

    if (room) {
      try {
        room.removeAllListeners();
        await room.disconnect();
      } catch {}
    }

    setConnectionState(ConnectionState.Disconnected);
    setLocalVideoTrack(null);
    setLocalScreenTrack(null);
    setRemoteTracks({});
    setMutedMic({});
    setRaisedHands({});
    setIsHandRaised(false);
    setActiveSpeakers([]);
    setLocalIdentity("");
    setWasRemoved(false);
  }, []);

  // CLEANUP
  useEffect(() => {
    return () => {
      connectPromiseRef.current = null;
      const room = roomRef.current;
      roomRef.current = null;
      room?.removeAllListeners();
      room?.disconnect().catch(() => {});
    };
  }, []);

  // 🔥 Extract single remote (1:1 call)
  const remoteId = Object.keys(remoteTracks)[0];
  const remoteParticipant = remoteTracks[remoteId] || {};

  // 👥 Full list of remote participants (group / batch calls)
  const remoteParticipants = Object.entries(remoteTracks).map(([id, u]) => ({
    id,
    name: u.name || id,
    video: u.video || null,
    audio: u.audio || null,
    screen: u.screen || null,
    screenAudio: u.screenAudio || null,
    micOn: !!u.audio && !mutedMic[id],
    handRaised: !!raisedHands[id],
    speaking: activeSpeakers.includes(id),
  }));

  return {
    connect,
    disconnect,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    toggleRaiseHand,
    lowerAllHands,
    connectionState,
    localVideoTrack,
    localScreenTrack,
    remoteVideoTrack: remoteParticipant.video || null,
    remoteAudioTrack: remoteParticipant.audio || null,
    screenShareTrack: remoteParticipant.screen || null,
    screenShareAudioTrack: remoteParticipant.screenAudio || null,
    remoteName: remoteParticipant.name || remoteId || null,
    remoteParticipants,
    isMicOn,
    isCamOn,
    isScreenSharing,
    isScreenShareSupported,
    isHandRaised,
    activeSpeakers,
    localIdentity,
    wasRemoved,
    remoteParticipantCount,
    isConnected: connectionState === ConnectionState.Connected,
  };
}