import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getSnapshot, Tldraw, loadSnapshot } from "tldraw";
import "tldraw/tldraw.css";
import {
  insertCheckpoint as insertCheckpointService,
  loadLatestWhiteboardSnapshot,
  saveLatestWhiteboardSnapshot,
} from "../utils/whiteboardService";

const CHECKPOINT_EVERY_MS = 15000;
const COLLAB_LOCK_KEY = 'collab_locked_room'

async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  throw new Error("Clipboard API unavailable");
}

// ------------------------------------------------------------------
// Button with hover state helper
// ------------------------------------------------------------------
function PurpleBtn({ onClick, disabled, children, variant = 'outline', style = {} }) {
  const [hover, setHover] = useState(false)
  const base = {
    fontSize: 12, fontWeight: 700, padding: '8px 16px', borderRadius: 999,
    border: '1.5px solid rgba(124,58,237,0.4)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all .18s ease',
    opacity: disabled ? 0.5 : 1,
    ...style,
  }
  const filled = variant === 'filled'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...base,
        background: filled
          ? (hover ? 'linear-gradient(120deg,#6d28d9,#7c3aed)' : 'linear-gradient(120deg,#7c3aed,#9333ea)')
          : (hover ? 'rgba(124,58,237,0.08)' : '#ffffff'),
        color: filled ? '#ffffff' : '#7c3aed',
        boxShadow: hover
          ? (filled ? '0 4px 14px rgba(124,58,237,0.35)' : '0 4px 14px rgba(124,58,237,0.18)')
          : '0 2px 8px rgba(124,58,237,0.08)',
      }}
    >
      {children}
    </button>
  )
}

// ------------------------------------------------------------------
// Toolbar
// ------------------------------------------------------------------
function Toolbar({
  roomIdValue,
  isRoomIdValid,
  isSavingLatest,
  isSavingCheckpoint,
  lastCheckpointAt,
  status,
  onSave,
  onOpenCheckpointModal,
  onCopyLink,
}) {
  const [playbackHover, setPlaybackHover] = useState(false)

  return (
    <div style={{ position:'relative', borderRadius:20, padding:2, background:'transparent' }}>
      <div style={{
        position:'absolute', inset:0, borderRadius:20, zIndex:0,
        background:'conic-gradient(from 0deg,#7c3aed,#c026d3,#9333ea,#7c3aed)',
        opacity:0.45,
      }} />
      <div style={{
        position:'relative', zIndex:1,
        background: 'rgba(255,255,255,0.97)',
        borderRadius: 18,
        padding: '16px 18px',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 18px 60px rgba(124,58,237,0.12)',
        minWidth: 320,
      }}>
        {/* header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, marginBottom:4 }}>
          <span className="g-text" style={{ fontSize:14, fontWeight:900, letterSpacing:0.2 }}>
            Collab Mode
          </span>
          <span style={{
            fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:999,
            background:'rgba(124,58,237,0.08)', color:'#7c3aed', border:'1px solid rgba(124,58,237,0.18)',
          }}>
            {roomIdValue || '—'}
          </span>
        </div>

        <div style={{ fontSize:12, marginTop:4, color:'#6b7280', lineHeight:1.45 }}>
          Auto-checkpoints every <b style={{ color:'#7c3aed' }}>15 s</b>. Replay anytime in Playback mode.
        </div>

        {/* primary actions */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:14 }}>
          <Link
            to="/"
            style={{
              fontSize:12, fontWeight:700, padding:'8px 16px', borderRadius:999,
              border:'1.5px solid rgba(124,58,237,0.4)',
              background:'#ffffff', color:'#7c3aed', textDecoration:'none',
              boxShadow:'0 2px 8px rgba(124,58,237,0.08)',
              transition:'all .18s ease',
            }}
          >
            ← Home
          </Link>

          <PurpleBtn onClick={onSave} disabled={isSavingLatest || !isRoomIdValid}>
            {isSavingLatest ? 'Saving…' : 'Save Data'}
          </PurpleBtn>

          <PurpleBtn onClick={onOpenCheckpointModal} disabled={isSavingCheckpoint || !isRoomIdValid}>
            {isSavingCheckpoint ? 'Saving…' : 'Checkpoint'}
          </PurpleBtn>

          <Link
            to={`/playback/${encodeURIComponent(roomIdValue)}`}
            onMouseEnter={() => setPlaybackHover(true)}
            onMouseLeave={() => setPlaybackHover(false)}
            style={{
              fontSize:12, fontWeight:700, padding:'8px 16px', borderRadius:999,
              border:'1.5px solid rgba(124,58,237,0.4)',
              background: playbackHover ? 'linear-gradient(120deg,#7c3aed,#9333ea)' : '#ffffff',
              color: playbackHover ? '#ffffff' : '#7c3aed',
              textDecoration:'none',
              boxShadow: playbackHover ? '0 4px 14px rgba(124,58,237,0.28)' : '0 2px 8px rgba(124,58,237,0.08)',
              transition:'all .18s ease',
            }}
          >
            Open Playback ↗
          </Link>
        </div>

        {/* copy link row */}
        <div style={{ marginTop:12 }}>
          <PurpleBtn onClick={onCopyLink} disabled={!isRoomIdValid}>
            Copy Collab Link
          </PurpleBtn>
        </div>

        {/* status / checkpoint time */}
        {lastCheckpointAt ? (
          <div style={{ marginTop:10, fontSize:11, color:'#7c3aed', opacity:0.75 }}>
            Last checkpoint: {new Date(lastCheckpointAt).toLocaleTimeString()}
          </div>
        ) : null}

        {status ? (
          <div style={{
            marginTop:6, fontSize:12, fontWeight:600,
            color: status.type === 'error' ? '#dc2626' : status.type === 'success' ? '#16a34a' : '#7c3aed',
          }}>
            {status.message}
          </div>
        ) : null}
      </div>
    </div>
  )
}

// ------------------------------------------------------------------
// Main component
// ------------------------------------------------------------------
const CollabComp = () => {
  const { roomId } = useParams();
  const roomIdValue = (roomId || "").trim();
  const isRoomIdValid = roomIdValue.length > 0;

  const mountedRoomId = useRef(roomIdValue)
  const navigate = useNavigate()

  // sessionStorage-based lock — survives remounts caused by URL bar edits
  useEffect(() => {
    const id = mountedRoomId.current
    const stored = sessionStorage.getItem(COLLAB_LOCK_KEY)
    if (!stored) {
      sessionStorage.setItem(COLLAB_LOCK_KEY, id)
    } else if (stored !== id) {
      sessionStorage.removeItem(COLLAB_LOCK_KEY)
      navigate('/collab', { replace: true })
    }
  }, [navigate])

  const editorRef = useRef(null);
  const checkpointTimerRef = useRef(null);
  const isCheckpointingRef = useRef(false);
  const autoCheckpointCountRef = useRef(0);
  const lastSnapshotHashRef = useRef(null);
  const statusTimerRef = useRef(null);

  const [editorReady, setEditorReady] = useState(false);
  const [isLoadingBoard, setIsLoadingBoard] = useState(false);
  const [lastCheckpointAt, setLastCheckpointAt] = useState(null);
  const [status, setStatus] = useState(null);
  const [isSavingLatest, setIsSavingLatest] = useState(false);
  const [isSavingCheckpoint, setIsSavingCheckpoint] = useState(false);
  const [isTitleModalOpen, setIsTitleModalOpen] = useState(false);
  const [manualTitleDraft, setManualTitleDraft] = useState("");

  const showStatus = useCallback((type, message) => {
    setStatus({ type, message });
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    statusTimerRef.current = setTimeout(() => setStatus(null), 3200);
  }, []);

  useEffect(() => () => { if (statusTimerRef.current) clearTimeout(statusTimerRef.current) }, []);

  const collabUrl = useMemo(() => {
    if (!isRoomIdValid) return "";
    return `${window.location.origin}/collab/${encodeURIComponent(roomIdValue)}`;
  }, [isRoomIdValid, roomIdValue]);

  const buildAutoCheckpointTitle = useCallback(() => {
    autoCheckpointCountRef.current += 1;
    const step = autoCheckpointCountRef.current;
    const t = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return step === 1 ? `Starting board - ${t}` : `Auto checkpoint ${step} - ${t}`;
  }, []);

  const insertCheckpoint = useCallback(
    async (editor, title, { silent } = { silent: true }) => {
      if (!roomIdValue || !editor || isCheckpointingRef.current) return;
      isCheckpointingRef.current = true;
      if (!silent) setIsSavingCheckpoint(true);
      try {
        const snapshot = getSnapshot(editor.store);
        await insertCheckpointService(roomIdValue, snapshot, title);
        setLastCheckpointAt(new Date().toISOString());
        if (!silent) showStatus("success", "Checkpoint saved.");
      } catch (e) {
        console.error("Checkpoint insert error:", e);
        if (!silent) showStatus("error", "Could not save checkpoint.");
      } finally {
        isCheckpointingRef.current = false;
        if (!silent) setIsSavingCheckpoint(false);
      }
    },
    [roomIdValue, showStatus]
  );

  const loadData = useCallback(async (editor) => {
    if (!roomIdValue) return;
    setIsLoadingBoard(true);
    try {
      const snapshot = await loadLatestWhiteboardSnapshot(roomIdValue);
      if (snapshot) {
        loadSnapshot(editor.store, snapshot);
        lastSnapshotHashRef.current = JSON.stringify(snapshot).length;
      }
    } catch (e) {
      console.error("Unexpected load error:", e);
      showStatus("error", "Could not load saved board.");
    } finally {
      setIsLoadingBoard(false);
    }
  }, [roomIdValue, showStatus]);

  const handleSave = useCallback(async () => {
    const editor = editorRef.current;
    if (!roomIdValue) return;
    if (!editor) return showStatus("error", "Editor not ready yet.");
    setIsSavingLatest(true);
    try {
      const snapshot = getSnapshot(editor.store);
      await saveLatestWhiteboardSnapshot(roomIdValue, snapshot);
      showStatus("success", "Board saved.");
    } catch (e) {
      console.error("Save Data error:", e);
      showStatus("error", "Could not save board.");
    } finally {
      setIsSavingLatest(false);
    }
  }, [roomIdValue, showStatus]);

  const handleOpenCheckpointModal = useCallback(() => {
    if (!editorRef.current) return showStatus("error", "Editor not ready yet.");
    const t = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setManualTitleDraft(`Checkpoint - ${t}`);
    setIsTitleModalOpen(true);
  }, [showStatus]);

  const handleCopyLink = useCallback(async () => {
    const text = collabUrl.trim();
    if (!text) return;
    try {
      await copyToClipboard(text);
      showStatus("success", "Collab link copied.");
    } catch (e) {
      console.error("Copy link error:", e);
      showStatus("error", "Copy failed.");
    }
  }, [collabUrl, showStatus]);

  const confirmManualCheckpoint = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) return;
    const trimmed = (manualTitleDraft || "").trim();
    const t = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const finalTitle = trimmed.length ? trimmed : `Checkpoint - ${t}`;
    await insertCheckpoint(editor, finalTitle, { silent: false });
    setIsTitleModalOpen(false);
  }, [insertCheckpoint, manualTitleDraft]);

  useEffect(() => {
    if (!isRoomIdValid || !editorReady) return;
    if (checkpointTimerRef.current) return;

    const tick = () => {
      const editor = editorRef.current;
      if (!editor) return;
      const snapshot = getSnapshot(editor.store);
      const currentHash = JSON.stringify(snapshot).length;
      if (currentHash === lastSnapshotHashRef.current) return;
      lastSnapshotHashRef.current = currentHash;
      insertCheckpoint(editor, buildAutoCheckpointTitle(), { silent: true });
    };

    const initialTimer = setTimeout(tick, 2500);
    checkpointTimerRef.current = setInterval(tick, CHECKPOINT_EVERY_MS);

    return () => {
      clearTimeout(initialTimer);
      if (checkpointTimerRef.current) clearInterval(checkpointTimerRef.current);
      checkpointTimerRef.current = null;
    };
  }, [buildAutoCheckpointTitle, editorReady, insertCheckpoint, isRoomIdValid]);

  if (!isRoomIdValid) {
    return (
      <div style={{ padding: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Invalid room id.</div>
        <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>
          Open <code>/collab/:roomId</code> with a real roomId in the URL.
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: 'linear-gradient(145deg,#ffffff 0%,#f5f0ff 40%,#fdf4ff 70%,#ffffff 100%)' }}>

      {/* floating bg shapes */}
      <div style={{ position:'absolute', top:'8%', right:'12%', width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle,rgba(124,58,237,0.08) 0%,transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'15%', left:'6%', width:160, height:160, borderRadius:'50%', background:'radial-gradient(circle,rgba(168,85,247,0.07) 0%,transparent 70%)', pointerEvents:'none' }} />

      {/* Checkpoint title modal */}
      {isTitleModalOpen ? (
        <div
          style={{
            position: "absolute", inset: 0,
            background: "rgba(109,40,217,0.12)",
            backdropFilter: "blur(6px)",
            zIndex: 50,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16,
          }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) setIsTitleModalOpen(false); }}
        >
          <div style={{
            width: 440, maxWidth: "100%",
            background: "rgba(255,255,255,0.98)",
            border: "1.5px solid rgba(124,58,237,0.3)",
            borderRadius: 20,
            padding: 24,
            boxShadow: "0 24px 80px rgba(124,58,237,0.18)",
          }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>
              <span className="g-text">Name this Checkpoint</span>
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: '#6b7280' }}>
              This title appears in playback so you can jump to important moments.
            </div>

            <input
              value={manualTitleDraft}
              onChange={(e) => setManualTitleDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") confirmManualCheckpoint(); }}
              autoFocus
              style={{
                width: "100%", marginTop: 14, padding: "11px 14px",
                borderRadius: 12,
                border: "1.5px solid rgba(124,58,237,0.35)",
                boxSizing: "border-box",
                fontSize: 14,
                outline: "none",
                boxShadow: "0 0 0 3px rgba(124,58,237,0.08)",
              }}
              placeholder="e.g., Initial layout"
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setIsTitleModalOpen(false)}
                disabled={isSavingCheckpoint}
                style={{
                  padding: "9px 18px", borderRadius: 999, fontSize: 12, fontWeight: 700,
                  border: "1.5px solid rgba(124,58,237,0.3)",
                  background: "white", color: "#7c3aed", cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmManualCheckpoint}
                disabled={isSavingCheckpoint}
                style={{
                  padding: "9px 18px", borderRadius: 999, fontSize: 12, fontWeight: 700,
                  border: "none",
                  background: isSavingCheckpoint ? 'rgba(124,58,237,0.5)' : 'linear-gradient(120deg,#7c3aed,#9333ea)',
                  color: "white", cursor: isSavingCheckpoint ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 14px rgba(124,58,237,0.3)",
                }}
              >
                {isSavingCheckpoint ? "Saving…" : "Save Checkpoint"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Loading overlay */}
      {isLoadingBoard ? (
        <div style={{
          position: "absolute", inset: 0, zIndex: 40,
          background: "rgba(245,240,255,0.75)",
          display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(6px)",
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#7c3aed" }}>
            Loading board…
          </div>
        </div>
      ) : null}

      <Tldraw
        onMount={(editor) => {
          editorRef.current = editor;
          setEditorReady(true);
          loadData(editor);
        }}
      />

      <div style={{ position: "absolute", top: 60, left: 14, zIndex: 20, pointerEvents: "none" }}>
        <div style={{ pointerEvents: "auto" }}>
          <Toolbar
            roomIdValue={roomIdValue}
            isRoomIdValid={isRoomIdValid}
            isSavingLatest={isSavingLatest}
            isSavingCheckpoint={isSavingCheckpoint}
            lastCheckpointAt={lastCheckpointAt}
            status={status}
            onSave={handleSave}
            onOpenCheckpointModal={handleOpenCheckpointModal}
            onCopyLink={handleCopyLink}
          />
        </div>
      </div>
    </div>
  );
};

export default CollabComp;
