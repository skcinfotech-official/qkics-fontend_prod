import { useEffect, useState, useRef, useCallback, Fragment } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaDesktop,
  FaRegCommentDots,
  FaRegStickyNote,
  FaPaperPlane,
  FaPaperclip,
  FaPhoneSlash,
  FaTimes,
  FaCircle,
  FaExclamationTriangle,
  FaHandPaper,
  FaUserSlash,
  FaBan,
  FaCommentSlash,
} from "react-icons/fa";
import { getAccessToken } from "../redux/store/tokenManager";
import ModalOverlay from "./ui/ModalOverlay";
import { useLiveKit } from "./hooks/useLiveKit";
import { useCallChat } from "./hooks/useCallChat";
import {
  getCallRoom,
  getCallMessages,
  getMyNote,
  uploadCallFile,
  saveMyNote,
  endCall,
  muteCallParticipant,
  muteAllCallParticipants,
  removeCallParticipant,
} from "./utils/callApi";

/**
 * Enhanced Video Renderer that handles orientation and aspect ratios safely.
 * Prevents stretching, cropping, and rotation issues in cross-platform calls.
 */
function SafeVideoRenderer({ track, isLocal = false, isScreen = false, cover = false, className = "" }) {
  const videoRef = useRef(null);
  // eslint-disable-next-line no-unused-vars
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!track || !el) return;

    track.attach(el);

    if (track.dimensions) {
      setIsPortrait(track.dimensions.height > track.dimensions.width);
    }

    const handleDimensions = (dims) => {
      setIsPortrait(dims.height > dims.width);
    };

    track.on("dimensionsChanged", handleDimensions);
    return () => {
      track.off("dimensionsChanged", handleDimensions);
      track.detach(el);
    };
  }, [track]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={true} // Always mute video tags as audio is handled separately; ensures auto-play on mobile
      style={{ objectFit: cover ? "cover" : isScreen ? "contain" : (isLocal ? "cover" : "contain") }}
      className={`w-full h-full bg-black/40 transition-opacity duration-300 ${className}`}
    />
  );
}

/** Hidden audio sink for a single remote participant's track (group calls). */
function RemoteAudio({ track }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!track || !el) return;
    track.attach(el);
    return () => track.detach(el);
  }, [track]);
  return <audio ref={ref} autoPlay className="hidden" />;
}

/** One tile in the group grid — video or an initials avatar fallback.
 *  `fill` makes the tile fill its grid cell (gallery); otherwise it keeps a
 *  16:9 box (used in the screen-share filmstrip). */
function ParticipantTile({
  name,
  videoTrack,
  isLocal = false,
  micOn = true,
  handRaised = false,
  speaking = false,
  fill = false,
  canMute = false,
  onMute,
  canRemove = false,
  onRemove,
  canBlock = false,
  isBlocked = false,
  onToggleBlock,
}) {
  const initial = (name || "?").trim().charAt(0).toUpperCase() || "?";

  // Speaking (emerald) takes ring priority; raised hand (amber) otherwise.
  const ring = speaking
    ? "ring-2 ring-emerald-400"
    : handRaised
    ? "ring-2 ring-amber-400"
    : "ring-1 ring-white/10";

  return (
    <div
      className={`group/tile relative ${fill ? "h-full w-full" : "aspect-video"} min-h-0 overflow-hidden rounded-xl sm:rounded-2xl bg-neutral-800 shadow-lg transition-all ${ring}`}
    >
      {videoTrack ? (
        <SafeVideoRenderer track={videoTrack} isLocal={isLocal} cover />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20 text-base font-bold text-red-300 ring-1 ring-red-500/30 sm:h-14 sm:w-14 sm:text-lg">
            {initial}
          </div>
        </div>
      )}

      {/* Host controls (appear on hover; always tappable on touch) */}
      {(canMute || canRemove || canBlock) && (
        <div className="absolute left-1.5 top-1.5 flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover/tile:opacity-100">
          {canMute && (
            <button
              onClick={onMute}
              title="Mute this participant"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white ring-1 ring-white/20 backdrop-blur-sm transition hover:bg-red-600"
            >
              <FaMicrophoneSlash className="text-2xs" />
            </button>
          )}
          {canBlock && (
            <button
              onClick={onToggleBlock}
              title={isBlocked ? "Unblock chat" : "Block from chat"}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-white ring-1 ring-white/20 backdrop-blur-sm transition ${
                isBlocked ? "bg-amber-600 hover:bg-amber-500" : "bg-black/60 hover:bg-amber-600"
              }`}
            >
              <FaCommentSlash className="text-2xs" />
            </button>
          )}
          {canRemove && (
            <button
              onClick={onRemove}
              title="Remove from call"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white ring-1 ring-white/20 backdrop-blur-sm transition hover:bg-red-600"
            >
              <FaUserSlash className="text-2xs" />
            </button>
          )}
        </div>
      )}

      {/* Badges (raised hand / blocked) */}
      <div className="absolute right-1.5 top-1.5 flex gap-1">
        {isBlocked && (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/90 text-black shadow-lg" title="Blocked from chat">
            <FaBan className="text-2xs" />
          </div>
        )}
        {handRaised && (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-black shadow-lg animate-bounce">
            <FaHandPaper className="text-2xs" />
          </div>
        )}
      </div>

      {/* Name + mic state */}
      <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-2xs font-semibold backdrop-blur-sm sm:bottom-2 sm:left-2 sm:px-2">
        {!micOn && <FaMicrophoneSlash className="text-red-400" />}
        <span className="max-w-[24vw] truncate sm:max-w-[10rem]">{isLocal ? "You" : name}</span>
      </span>
    </div>
  );
}

/** Best column count so `n` tiles fill the stage without overflow.
 *  Narrow (mobile) screens cap columns so tiles stay tall enough. */
function useGridColumns(n) {
  const [isNarrow, setIsNarrow] = useState(
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );
  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (n <= 1) return 1;
  let cols = Math.ceil(Math.sqrt(n));
  const maxCols = isNarrow ? 2 : 4;
  cols = Math.min(cols, maxCols);
  return Math.max(1, cols);
}

/**
 * Group (batch) call stage — gallery grid of every participant, or a
 * screen-share priority view. Attaches every remote's audio.
 */
function GroupStage({
  lk,
  isHost = false,
  onMuteParticipant,
  onRemoveParticipant,
  onToggleBlock,
  blockedUserIds = [],
}) {
  const remotes = lk.remoteParticipants || [];
  const remoteSharer = remotes.find((p) => p.screen);
  // Screen to feature: a remote's, or the local user's own share.
  const screenTrack = remoteSharer?.screen || (lk.isScreenSharing ? lk.localScreenTrack : null);
  const totalTiles = remotes.length + 1; // + self
  const localSpeaking = (lk.activeSpeakers || []).includes(lk.localIdentity);

  const cols = useGridColumns(totalTiles);
  const rows = Math.ceil(totalTiles / cols);

  // Names of everyone with a raised hand (for the top banner)
  const raisedNames = [
    ...(lk.isHandRaised ? ["You"] : []),
    ...remotes.filter((p) => p.handRaised).map((p) => p.name),
  ];

  const audioSinks = remotes.map((p) => (
    <Fragment key={`aud-${p.id}`}>
      {p.audio && <RemoteAudio track={p.audio} />}
      {p.screenAudio && <RemoteAudio track={p.screenAudio} />}
    </Fragment>
  ));

  const selfTile = (fill) => (
    <ParticipantTile
      name="You"
      isLocal
      fill={fill}
      micOn={lk.isMicOn}
      handRaised={lk.isHandRaised}
      speaking={localSpeaking}
      videoTrack={lk.isCamOn ? lk.localVideoTrack : null}
    />
  );

  const remoteTile = (p, fill) => (
    <ParticipantTile
      name={p.name}
      videoTrack={p.video}
      fill={fill}
      micOn={p.micOn}
      handRaised={p.handRaised}
      speaking={p.speaking}
      canMute={isHost && p.micOn}
      onMute={() => onMuteParticipant?.(p.id)}
      canRemove={isHost}
      onRemove={() => onRemoveParticipant?.(p.id, p.name)}
      canBlock={isHost}
      isBlocked={blockedUserIds.includes(String(p.id))}
      onToggleBlock={() => onToggleBlock?.(p.id, !blockedUserIds.includes(String(p.id)))}
    />
  );

  // Raised-hands banner shown over the stage (useful when a tile is scrolled off)
  const banner = raisedNames.length > 0 && (
    <div className="pointer-events-none absolute left-1/2 top-3 z-30 -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-full bg-amber-400/95 px-3 py-1.5 text-2xs font-bold text-black shadow-lg backdrop-blur-sm">
        <FaHandPaper className="text-xs" />
        <span className="max-w-[70vw] truncate">
          {raisedNames.length === 1
            ? `${raisedNames[0]} raised their hand`
            : `${raisedNames.length} hands raised — ${raisedNames.join(", ")}`}
        </span>
      </div>
    </div>
  );

  // ── Screen-share priority view (screen centre, people in a filmstrip) ──
  if (screenTrack) {
    return (
      <div className="relative flex h-full w-full flex-col">
        {banner}
        <div className="flex min-h-0 flex-1 items-center justify-center bg-black">
          <SafeVideoRenderer track={screenTrack} isScreen />
        </div>
        <div className="flex shrink-0 gap-2 overflow-x-auto bg-black/40 p-2 pb-24">
          <div className="aspect-video w-28 shrink-0 sm:w-44">{selfTile(true)}</div>
          {remotes.map((p) => (
            <div key={p.id} className="aspect-video w-28 shrink-0 sm:w-44">
              {remoteTile(p, true)}
            </div>
          ))}
        </div>
        {audioSinks}
      </div>
    );
  }

  // ── Gallery grid — tiles shrink to fit; no page scroll ──
  return (
    <div className="relative flex h-full w-full flex-col p-1.5 pt-16 pb-24 sm:p-3 sm:pt-16 sm:pb-24">
      {banner}
      <div
        className="grid min-h-0 flex-1 gap-1.5 sm:gap-3"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        }}
      >
        {selfTile(true)}
        {remotes.map((p) => (
          <Fragment key={p.id}>{remoteTile(p, true)}</Fragment>
        ))}
      </div>

      {remotes.length === 0 && (
        <p className="mt-3 text-center text-sm font-medium text-neutral-400">
          {lk.isConnected ? "Waiting for others to join…" : "Connecting…"}
        </p>
      )}

      {audioSinks}
    </div>
  );
}

export default function VideoCallComponent({ call_room_id, token, onCallEnd }) {
  const remoteAudioRef = useRef(null);
  const screenAudioRef = useRef(null);
  const chatEndRef = useRef(null);
  const fileRef = useRef(null);

  const lk = useLiveKit();
  const chat = useCallChat(call_room_id, token);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const [scheduledEnd, setScheduledEnd] = useState(null);
  const [isBatch, setIsBatch] = useState(false);
  const [hostId, setHostId] = useState("");
  const [hasRemoteJoined, setHasRemoteJoined] = useState(false);
  const [activePanel, setActivePanel] = useState(null); // "chat" | "notes" | null
  const [note, setNote] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [lastSeenCount, setLastSeenCount] = useState(0);
  const timerRef = useRef(null);

  const unreadCount = activePanel === "chat" ? 0 : Math.max(0, chat.messages.length - lastSeenCount);

  const openPanel = useCallback((panel) => {
    setActivePanel((curr) => {
      const next = curr === panel ? null : panel;
      if (next === "chat") setLastSeenCount(chat.messages.length);
      return next;
    });
  }, [chat.messages.length]);

  useEffect(() => {
    (async () => {
      try {
        const roomData = await getCallRoom(call_room_id);
        setIsBatch(Boolean(roomData.is_batch));
        setHostId(roomData.advisor?.id != null ? String(roomData.advisor.id) : "");
        if (!roomData.can_join) {
          setError("This call is not available right now or has already ended.");
          setLoading(false);
          return;
        }
        if (!roomData.livekit_token || !roomData.livekit_url) {
          setError("Video server is unavailable. Please try again in a moment.");
          setLoading(false);
          return;
        }
        const history = await getCallMessages(call_room_id);
        const noteData = await getMyNote(call_room_id);
        setNote(noteData.content || "");
        await lk.connect(roomData.livekit_url, roomData.livekit_token);
        chat.connect(history);
        if (roomData.scheduled_end) {
          setScheduledEnd(new Date(roomData.scheduled_end).getTime());
        }
        setLoading(false);
      } catch (e) {
        setError(e.message);
        setLoading(false);
      }
    })();
    return () => {
      clearInterval(timerRef.current);
      lk.disconnect();
      chat.disconnect();
    };
  }, [call_room_id, lk.connect, chat.connect, lk.disconnect, chat.disconnect]);

  const [isEnding, setIsEnding] = useState(false);

  const handleEndCall = useCallback(async () => {
    setIsEnding(true);
    try {
      await lk.disconnect().catch(() => {});
      await chat.disconnect().catch(() => {});
      // Allow endCall to fail quietly if the room is already gone
      await endCall(call_room_id).catch(() => {});
    } finally {
      // Force navigation back to bookings no matter what
      onCallEnd?.();
    }
  }, [lk, chat, call_room_id, onCallEnd]);

  const triggerEndCall = () => {
    if (isEnding) return;
    setShowEndConfirm(true);
  };

  // ───────── Synced Timer (Drift-free) ─────────
  useEffect(() => {
    if (!scheduledEnd) return;
    const tick = () => {
      const now = Date.now();
      const left = Math.max(0, Math.floor((scheduledEnd - now) / 1000));
      setRemaining(left);
      if (left <= 0 && !isEnding) {
        handleEndCall();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [scheduledEnd, handleEndCall, isEnding]);

  // ───────── Synced Call Termination (Participant Monitoring) ─────────
  // Only applies to 1:1 calls. In a group (batch) call, people come and go —
  // the call ends via the End button or the scheduled-end timer, not because
  // one participant left.
  useEffect(() => {
    if (isBatch) return;
    if (lk.remoteParticipantCount > 0) {
      setHasRemoteJoined(true);
    }
    // If someone was present and now they've left, terminate for this side too
    if (hasRemoteJoined && lk.remoteParticipantCount === 0 && !isEnding && !loading) {
      handleEndCall();
    }
  }, [isBatch, lk.remoteParticipantCount, hasRemoteJoined, isEnding, loading, handleEndCall]);

  useEffect(() => {
    const track = lk.remoteAudioTrack;
    const el = remoteAudioRef.current;
    if (!track || !el) return;
    track.attach(el);
    return () => { track.detach(el); };
  }, [lk.remoteAudioTrack]);

  useEffect(() => {
    const track = lk.screenShareAudioTrack;
    const el = screenAudioRef.current;
    if (!track || !el) return;
    track.attach(el);
    return () => { track.detach(el); };
  }, [lk.screenShareAudioTrack]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages]);


  const handleSend = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || iAmBlocked) return;
    chat.sendMessage(chatInput);
    setChatInput("");
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const msg = await uploadCallFile(call_room_id, file);
      chat.notifyFileShared(msg);
    } catch (err) {
      alert(err.message);
    }
    e.target.value = "";
  };

  const handleNoteSave = () => saveMyNote(call_room_id, note);

  // Host (expert) controls for group calls
  const isHost = Boolean(isBatch && hostId && hostId === lk.localIdentity);

  const handleMuteParticipant = useCallback(async (identity) => {
    try {
      await muteCallParticipant(call_room_id, identity);
    } catch (err) {
      console.error("Failed to mute participant:", err);
      alert("Could not mute this participant.");
    }
  }, [call_room_id]);

  const handleMuteAll = useCallback(async () => {
    try {
      await muteAllCallParticipants(call_room_id);
    } catch (err) {
      console.error("Failed to mute everyone:", err);
      alert("Could not mute everyone.");
    }
  }, [call_room_id]);

  const handleRemoveParticipant = useCallback(async (identity, name) => {
    if (!window.confirm(`Remove ${name || "this participant"} from the call?`)) return;
    try {
      await removeCallParticipant(call_room_id, identity);
    } catch (err) {
      console.error("Failed to remove participant:", err);
      alert("Could not remove this participant.");
    }
  }, [call_room_id]);

  // Host blocks/unblocks a participant from the in-call chat (spam control).
  const handleToggleBlock = useCallback((identity, blocked) => {
    chat.blockUser(identity, blocked);
  }, [chat]);

  // Am I (this client) blocked from chatting?
  const iAmBlocked =
    !!lk.localIdentity && (chat.blockedUserIds || []).includes(String(lk.localIdentity));

  const anyHandRaised =
    lk.isHandRaised || (lk.remoteParticipants || []).some((p) => p.handRaised);

  const fmt = (s) => {
    if (s === null || s === undefined) return "";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const mm = String(m).padStart(2, "0");
    const ss = String(sec).padStart(2, "0");
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-neutral-900 to-black text-white">
      <div className="relative flex items-center justify-center">
        <span className="absolute h-20 w-20 rounded-full bg-red-500/10 animate-ping" />
        <div className="h-14 w-14 rounded-full border-4 border-white/10 border-t-red-500 animate-spin" />
      </div>
      <p className="mt-6 text-sm font-medium tracking-wide text-neutral-400">Connecting to your session…</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-screen gap-5 bg-gradient-to-b from-neutral-900 to-black px-6 text-center text-white">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 ring-1 ring-red-500/30">
        <FaPhoneSlash className="text-2xl text-red-400" />
      </div>
      <p className="max-w-sm text-sm leading-relaxed text-neutral-300">{error}</p>
      <button
        onClick={onCallEnd}
        className="rounded-xl bg-white/10 px-6 py-2.5 text-sm font-semibold transition hover:bg-white/20"
      >
        Go back
      </button>
    </div>
  );

  const isTimerLow = remaining !== null && remaining < 120;

  return (
    <div className="relative flex flex-col h-screen bg-neutral-950 text-white overflow-hidden">
      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-3 sm:px-5 py-2 sm:py-3 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-md z-20">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 shrink-0">
            <FaCircle className="text-red-500 text-3xs animate-pulse" />
            <span className="text-2xs sm:text-xs font-medium text-red-300">LIVE</span>
          </div>
          <h1 className="text-xs sm:text-sm font-medium text-neutral-200 truncate hidden xs:block sm:block">
            {isBatch
              ? `Group call · ${(lk.remoteParticipants?.length || 0) + 1} in call`
              : "Meeting in progress"}
          </h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {remaining !== null && remaining <= 60 && remaining > 0 && (
            <div className="animate-bounce px-2 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-2xs sm:text-xs text-amber-300 font-bold uppercase tracking-wider">
              The meeting will be end soon
            </div>
          )}
          {remaining !== null && (
            <div
              className={`px-2 sm:px-3 py-1 rounded-md font-mono text-xs sm:text-sm tabular-nums ${
                isTimerLow
                  ? "bg-red-500/15 text-red-300 border border-red-500/30"
                  : "bg-neutral-800 text-neutral-200"
              }`}
            >
              {fmt(remaining)}
            </div>
          )}
          <span
            className={`hidden sm:inline text-xs px-2 py-1 rounded ${
              lk.isConnected ? "text-emerald-400 bg-emerald-500/10" : "text-amber-400 bg-amber-500/10"
            }`}
          >
            {lk.isConnected ? "Connected" : "Reconnecting…"}
          </span>
        </div>
      </header>

      {/* ── Stage ── */}
      <div className="flex-1 flex overflow-hidden -mt-14">
        <section className="relative flex-1 bg-gradient-to-b from-neutral-900 to-black flex items-center justify-center">
          {isBatch ? (
            <GroupStage
              lk={lk}
              isHost={isHost}
              onMuteParticipant={handleMuteParticipant}
              onRemoveParticipant={handleRemoveParticipant}
              onToggleBlock={handleToggleBlock}
              blockedUserIds={chat.blockedUserIds}
            />
          ) : (
          <>
          {lk.screenShareTrack ? (
            <SafeVideoRenderer track={lk.screenShareTrack} isScreen={true} />
          ) : lk.remoteVideoTrack ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <SafeVideoRenderer track={lk.remoteVideoTrack} />
              {lk.remoteName && (
                <div className="absolute top-20 left-4 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md ring-1 ring-white/10 text-xs font-semibold tracking-wide animate-fadeIn">
                  {lk.remoteName}
                </div>
              )}
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-500 gap-4">
              <div className="relative flex items-center justify-center">
                <span className="absolute h-24 w-24 rounded-full bg-red-500/5 animate-ping" />
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
                  <FaVideo className="text-2xl text-neutral-500" />
                </div>
              </div>
              <p className="text-sm font-medium text-neutral-400">
                {lk.isConnected ? "Waiting for the other participant to join…" : "Connecting…"}
              </p>
            </div>
          )}

          {/* Remote Side-PiP (Visible when screen sharing) */}
          {lk.screenShareTrack && lk.remoteVideoTrack && (
            <div className="absolute bottom-52 sm:bottom-64 right-2 sm:right-4 w-28 sm:w-48 aspect-video rounded-xl overflow-hidden ring-1 ring-white/15 shadow-2xl z-20 transition-all duration-500">
              <SafeVideoRenderer track={lk.remoteVideoTrack} />
            </div>
          )}

          {/* Self PiP */}
          <div className="group absolute bottom-24 sm:bottom-28 right-2 sm:right-4 w-24 sm:w-44 aspect-video rounded-xl overflow-hidden ring-1 ring-white/15 shadow-2xl bg-neutral-800 transition-all duration-300 hover:ring-red-500/50">
            {lk.isCamOn && lk.localVideoTrack ? (
              <SafeVideoRenderer track={lk.localVideoTrack} isLocal={true} />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-neutral-900">
                <FaVideoSlash className="text-neutral-600 text-lg sm:text-xl" />
              </div>
            )}
            <span className="absolute bottom-1.5 left-1.5 sm:left-2 text-2xs font-semibold px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm">
              You
            </span>
          </div>

          {/* Hidden audio sinks */}
          <audio ref={remoteAudioRef} autoPlay className="hidden" />
          <audio ref={screenAudioRef} autoPlay className="hidden" />
          </>
          )}
        </section>

        {/* ── Side panel (desktop) / bottom sheet (mobile) ── */}
        {activePanel && (
          <>
            <div
              onClick={() => setActivePanel(null)}
              className="sm:hidden fixed inset-0 bg-black/60 z-20"
            />
            <aside className="fixed sm:static inset-x-0 bottom-0 sm:inset-auto z-30 sm:z-10 h-[75vh] max-h-[75vh] sm:h-auto sm:max-h-none w-full sm:w-[360px] bg-neutral-900/95 backdrop-blur-xl border-t sm:border-t-0 sm:border-l border-white/10 flex flex-col rounded-t-2xl sm:rounded-none overflow-hidden sm:m-3 sm:rounded-2xl sm:border">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10">
              <div className="flex gap-1 rounded-xl bg-black/30 p-1">
                <button
                  onClick={() => {
                    if (activePanel !== "chat") openPanel("chat");
                  }}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition ${
                    activePanel === "chat"
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  Chat
                </button>
                <button
                  onClick={() => {
                    if (activePanel !== "notes") setActivePanel("notes");
                  }}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition ${
                    activePanel === "notes"
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  My Notes
                </button>
              </div>
              <button
                onClick={() => setActivePanel(null)}
                className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition"
              >
                <FaTimes className="text-xs" />
              </button>
            </div>

            {activePanel === "chat" && (
              <>
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                  {chat.messages.length === 0 && (
                    <p className="text-center text-xs text-neutral-500 mt-8">
                      No messages yet. Start the conversation.
                    </p>
                  )}
                  {chat.messages.map((m, i) => (
                    <div key={m.id || i} className="flex flex-col gap-1">
                      <span className="text-2xs font-bold uppercase tracking-wide text-red-400">{m.senderUsername}</span>
                      {m.isFile ? (
                        <a
                          href={m.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex w-fit items-center gap-1.5 rounded-xl bg-white/5 px-3 py-2 text-sm text-emerald-400 ring-1 ring-white/10 hover:bg-white/10 break-all"
                        >
                          <FaPaperclip className="text-xs" />
                          {m.fileName}
                        </a>
                      ) : (
                        <span className="w-fit max-w-full rounded-2xl rounded-tl-sm bg-white/5 px-3 py-2 text-sm text-neutral-100 ring-1 ring-white/5 whitespace-pre-wrap break-words">
                          {m.text}
                        </span>
                      )}
                    </div>
                  ))}
                  {chat.isTyping && (
                    <div className="text-xs text-neutral-500 italic">Typing…</div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                {iAmBlocked ? (
                  <div className="flex items-center gap-2 px-4 pt-3 pb-24 sm:pb-3 border-t border-neutral-800">
                    <div className="flex w-full items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-2.5 text-2xs font-semibold text-amber-300 ring-1 ring-amber-500/20">
                      <FaBan className="shrink-0" />
                      The host has blocked you from chatting in this call.
                    </div>
                  </div>
                ) : (
                <form
                  onSubmit={handleSend}
                  className="flex items-center gap-2 px-3 pt-3 pb-24 sm:pb-3 border-t border-neutral-800"
                >
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="p-2 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800 transition"
                    title="Attach file"
                  >
                    <FaPaperclip />
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    onChange={handleFile}
                  />
                  <input
                    value={chatInput}
                    onChange={(e) => {
                      setChatInput(e.target.value);
                      chat.sendTyping(e.target.value.length > 0);
                    }}
                    onBlur={() => chat.sendTyping(false)}
                    placeholder="Type a message"
                    className="flex-1 bg-white/5 border border-white/10 focus:border-red-500/60 focus:ring-2 focus:ring-red-500/20 focus:outline-none rounded-full px-4 py-2 text-sm placeholder-neutral-500"
                  />
                  <button
                    type="submit"
                    className="flex h-9 w-9 items-center justify-center text-white bg-red-600 hover:bg-red-500 rounded-full transition disabled:opacity-40 disabled:hover:bg-red-600"
                    disabled={!chatInput.trim()}
                  >
                    <FaPaperPlane className="text-sm" />
                  </button>
                </form>
                )}
              </>
            )}

            {activePanel === "notes" && (
              <div className="flex-1 flex flex-col p-4 gap-3 pb-24 sm:pb-4">
                <p className="text-xs text-neutral-500 uppercase tracking-wide">
                  Private — only you can see these
                </p>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onBlur={handleNoteSave}
                  placeholder="Write your notes here…"
                  className="flex-1 bg-black/30 border border-white/10 focus:border-red-500/60 focus:ring-2 focus:ring-red-500/20 focus:outline-none rounded-xl p-3 text-sm placeholder-neutral-600 text-neutral-200 resize-none"
                />
                <button
                  onClick={handleNoteSave}
                  className="py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-sm font-semibold transition shadow-lg shadow-red-600/20"
                >
                  Save note
                </button>
              </div>
            )}
          </aside>
          </>
        )}
      </div>

      {/* ── Floating toolbar ── */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30">
        <div className="flex items-center gap-1.5 sm:gap-2 bg-black/60 backdrop-blur-xl ring-1 ring-white/10 rounded-2xl px-2.5 py-2.5 shadow-2xl shadow-black/50">
          <ToolbarButton
            onClick={lk.toggleMic}
            active={lk.isMicOn}
            icon={lk.isMicOn ? <FaMicrophone /> : <FaMicrophoneSlash />}
            label={lk.isMicOn ? "Mute" : "Unmute"}
          />
          <ToolbarButton
            onClick={lk.toggleCamera}
            active={lk.isCamOn}
            icon={lk.isCamOn ? <FaVideo /> : <FaVideoSlash />}
            label={lk.isCamOn ? "Stop video" : "Start video"}
          />
          <ToolbarButton
            onClick={async () => {
              try {
                await lk.toggleScreenShare();
              } catch (err) {
                // If the user simply cancelled the share dialog, don't show an error alert
                if (err.name === "NotAllowedError" || err.message?.includes("Permission denied")) {
                  return;
                }
                const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
                const isNotSecure = window.location.protocol !== "https:" && window.location.hostname !== "localhost";

                if (isIOS) {
                  alert("Apple blocks screen sharing in iOS browsers for privacy. Please use a desktop to share your screen.");
                } else if (isNotSecure) {
                  alert("Screen sharing requires a secure (HTTPS) connection. Please ensure you're using a secure link.");
                } else {
                  alert("Screen sharing failed: This may be blocked by your browser permissions or the OS.");
                }
              }
            }}
            highlight={lk.isScreenSharing}
            icon={<FaDesktop />}
            label={lk.isScreenSharing ? "Stop share" : "Share"}
            disabled={!lk.isScreenSharing && false} // Removed hardware gate to allow attempts
          />
          {isBatch && (
            <ToolbarButton
              onClick={lk.toggleRaiseHand}
              highlight={lk.isHandRaised}
              tone="amber"
              icon={<FaHandPaper />}
              label={lk.isHandRaised ? "Lower hand" : "Raise hand"}
            />
          )}
          {isHost && (lk.remoteParticipants || []).length > 0 && (
            <ToolbarButton
              onClick={handleMuteAll}
              icon={<FaMicrophoneSlash />}
              label="Mute everyone"
            />
          )}
          {isHost && anyHandRaised && (
            <ToolbarButton
              onClick={lk.lowerAllHands}
              icon={<FaHandPaper />}
              label="Lower all hands"
              badge={(lk.remoteParticipants || []).filter((p) => p.handRaised).length + (lk.isHandRaised ? 1 : 0)}
            />
          )}
          <ToolbarButton
            onClick={() => openPanel("chat")}
            highlight={activePanel === "chat"}
            icon={<FaRegCommentDots />}
            label="Chat"
            badge={unreadCount}
          />
          <ToolbarButton
            onClick={() => openPanel("notes")}
            highlight={activePanel === "notes"}
            icon={<FaRegStickyNote />}
            label="Notes"
          />

          <div className="w-px h-8 bg-white/10 mx-0.5 sm:mx-1" />

          <button
            onClick={triggerEndCall}
            className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 h-10 sm:h-12 rounded-2xl bg-red-600 hover:bg-red-500 transition shadow-lg shadow-red-600/30 active:scale-95"
            title="End call"
          >
            <FaPhoneSlash className="text-sm sm:text-base" />
            <span className="text-xs sm:text-sm font-semibold">End</span>
          </button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showEndConfirm}
        onCancel={() => setShowEndConfirm(false)}
        onConfirm={() => {
          setShowEndConfirm(false);
          handleEndCall();
        }}
        title="End Call?"
        message="Are you sure you want to leave this meeting?"
      />
    </div>
  );
}

function ConfirmationModal({ isOpen, onConfirm, onCancel, title, message }) {
  if (!isOpen) return null;
  return (
    <ModalOverlay close={onCancel}>
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scaleIn text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <FaExclamationTriangle className="text-red-500 text-xl" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-neutral-400 mb-6 text-sm">{message}</p>
        <div className="flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium transition"
          >
            Go back
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition shadow-lg shadow-red-600/20"
          >
            End Call
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

function ToolbarButton({ onClick, active = true, highlight = false, tone = "red", icon, label, badge = 0, disabled = false }) {
  const base = "relative flex items-center justify-center w-11 sm:w-12 h-10 sm:h-12 rounded-xl transition-all active:scale-95";
  const highlightStyle = tone === "amber"
    ? "bg-amber-400 hover:bg-amber-300 text-black shadow-lg shadow-amber-400/30"
    : "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30";
  const style = highlight
    ? highlightStyle
    : active
    ? "bg-white/10 hover:bg-white/20 text-white"
    : "bg-red-500/90 hover:bg-red-500 text-white";

  const disabledStyle = disabled ? "opacity-30 cursor-not-allowed grayscale" : "";

  return (
    <button
      onClick={disabled ? undefined : onClick}
      className={`${base} ${style} ${disabledStyle}`}
      title={label}
      disabled={disabled}
    >
      <span className="text-sm sm:text-lg">{icon}</span>
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[16px] sm:min-w-[18px] h-[16px] sm:h-[18px] px-1 rounded-full bg-red-500 ring-2 ring-black/60 text-2xs font-bold flex items-center justify-center">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}

export function VideoCallPage() {
  const { call_room_id } = useParams();
  const navigate = useNavigate();
  const token = getAccessToken();

  if (!token) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-950 text-white">
        Session expired. Please login again.
      </div>
    );
  }

  if (!call_room_id) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-950 text-white">
        Call session ID was not found. Please join from your bookings.
      </div>
    );
  }

  return (
    <VideoCallComponent
      call_room_id={call_room_id}
      token={token}
      onCallEnd={() => navigate("/my-bookings")}
    />
  );
}
