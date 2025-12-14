import { useState, useRef, useCallback, useEffect } from "react";

interface UseWebRTCScreenShareOptions {
  role: "teacher" | "student";
  userId?: string;
  classe?: string;
  onStreamReceived?: (stream: MediaStream) => void;
  onStreamEnded?: () => void;
  onScreenRequest?: (teacherId: string) => void;
}

interface StudentStream {
  studentId: string;
  stream: MediaStream;
  pc: RTCPeerConnection;
}

export function useWebRTCScreenShare({
  role,
  userId,
  classe,
  onStreamReceived,
  onStreamEnded,
  onScreenRequest,
}: UseWebRTCScreenShareOptions) {
  const [isSharing, setIsSharing] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentStreams, setStudentStreams] = useState<StudentStream[]>([]);
  
  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const clientIdRef = useRef<string | null>(null);
  const pendingScreenRequestRef = useRef<string | null>(null);

  const iceServers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ];

  const createPeerConnection = useCallback((targetId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection({ iceServers });
    
    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: "ice-candidate",
          payload: event.candidate,
          to: targetId,
        }));
      }
    };

    pc.ontrack = (event) => {
      if (event.streams[0]) {
        remoteStreamRef.current = event.streams[0];
        setIsReceiving(true);
        onStreamReceived?.(event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        setIsReceiving(false);
        onStreamEnded?.();
      }
    };

    peerConnectionsRef.current.set(targetId, pc);
    return pc;
  }, [onStreamReceived, onStreamEnded]);

  const connectWebSocket = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/screenshare`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: "register",
        role,
        userId,
        classe,
      }));
    };

    ws.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        await handleWebSocketMessage(message);
      } catch (error) {
        console.error("WebSocket message handling error:", error);
      }
    };

    ws.onclose = () => {
      setTimeout(() => {
        if (wsRef.current === ws) {
          connectWebSocket();
        }
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }, [role, userId, classe]);

  const handleWebSocketMessage = useCallback(async (message: any) => {
    switch (message.type) {
      case "connected":
        clientIdRef.current = message.clientId;
        break;

      case "teacher-sharing":
        if (role === "student" && message.payload.active) {
          setIsReceiving(true);
        }
        break;

      case "stop-share":
        if (role === "student") {
          setIsReceiving(false);
          remoteStreamRef.current = null;
          onStreamEnded?.();
          peerConnectionsRef.current.forEach((pc) => pc.close());
          peerConnectionsRef.current.clear();
        }
        break;

      case "offer":
        if (role === "student" && message.payload) {
          const pc = createPeerConnection(message.from);
          await pc.setRemoteDescription(new RTCSessionDescription(message.payload));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          
          wsRef.current?.send(JSON.stringify({
            type: "answer",
            payload: answer,
            to: message.from,
          }));
        }
        break;

      case "answer":
        if (role === "teacher" && message.payload && message.from) {
          const pc = peerConnectionsRef.current.get(message.from);
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(message.payload));
          }
        }
        break;

      case "ice-candidate":
        if (message.payload && message.from) {
          const pc = peerConnectionsRef.current.get(message.from);
          if (pc) {
            await pc.addIceCandidate(new RTCIceCandidate(message.payload));
          }
        }
        break;

      case "screen-request":
        if (role === "student") {
          pendingScreenRequestRef.current = message.payload.teacherId;
          onScreenRequest?.(message.payload.teacherId);
        }
        break;

      case "student-screen-offer":
        if (role === "teacher" && message.payload) {
          const pc = new RTCPeerConnection({ iceServers });
          
          pc.ontrack = (event) => {
            if (event.streams[0]) {
              setStudentStreams((prev) => [
                ...prev.filter((s) => s.studentId !== message.studentId),
                { studentId: message.studentId, stream: event.streams[0], pc },
              ]);
            }
          };
          
          pc.onicecandidate = (event) => {
            if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                type: "student-screen-ice",
                payload: event.candidate,
                to: message.from,
              }));
            }
          };
          
          peerConnectionsRef.current.set(`student-${message.studentId}`, pc);
          await pc.setRemoteDescription(new RTCSessionDescription(message.payload));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          
          wsRef.current?.send(JSON.stringify({
            type: "student-screen-answer",
            payload: answer,
            to: message.from,
          }));
        }
        break;

      case "student-screen-answer":
        if (role === "student" && message.payload && message.from) {
          const pc = peerConnectionsRef.current.get("teacher-view");
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(message.payload));
          }
        }
        break;

      case "student-screen-ice":
        if (message.payload && message.from) {
          const pcKey = role === "teacher" ? `student-${message.from}` : "teacher-view";
          const pc = peerConnectionsRef.current.get(pcKey);
          if (pc) {
            await pc.addIceCandidate(new RTCIceCandidate(message.payload));
          }
        }
        break;

      case "student-declined":
        setStudentStreams((prev) =>
          prev.filter((s) => s.studentId !== message.payload.studentId)
        );
        break;
    }
  }, [role, createPeerConnection, onStreamEnded, onScreenRequest]);

  useEffect(() => {
    connectWebSocket();
    
    return () => {
      wsRef.current?.close();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      peerConnectionsRef.current.forEach((pc) => pc.close());
    };
  }, [connectWebSocket]);

  const startScreenShare = useCallback(async (targetClasses: string[]) => {
    if (role !== "teacher") return;
    
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "monitor",
          cursor: "always",
        } as any,
        audio: true,
      });
      
      localStreamRef.current = stream;
      setIsSharing(true);
      setError(null);
      
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
      
      wsRef.current?.send(JSON.stringify({
        type: "start-share",
        targetClasses,
      }));
      
      const pc = new RTCPeerConnection({ iceServers });
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      
      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: "ice-candidate",
            payload: event.candidate,
          }));
        }
      };
      
      peerConnectionsRef.current.set("broadcast", pc);
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      wsRef.current?.send(JSON.stringify({
        type: "offer",
        payload: offer,
      }));
      
      return stream;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur de partage d'écran";
      setError(errorMessage);
      throw err;
    }
  }, [role]);

  const stopScreenShare = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setIsSharing(false);
    
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();
    
    wsRef.current?.send(JSON.stringify({
      type: "stop-share",
    }));
  }, []);

  const requestStudentScreen = useCallback((studentId: string) => {
    if (role !== "teacher") return;
    
    wsRef.current?.send(JSON.stringify({
      type: "request-student-screen",
      studentId,
    }));
  }, [role]);

  const acceptScreenRequest = useCallback(async () => {
    if (role !== "student" || !pendingScreenRequestRef.current) return;
    
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "monitor",
          cursor: "always",
        } as any,
        audio: false,
      });
      
      const pc = new RTCPeerConnection({ iceServers });
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      
      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: "student-screen-ice",
            payload: event.candidate,
            to: pendingScreenRequestRef.current,
          }));
        }
      };
      
      stream.getVideoTracks()[0].onended = () => {
        pc.close();
        peerConnectionsRef.current.delete("teacher-view");
      };
      
      peerConnectionsRef.current.set("teacher-view", pc);
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      wsRef.current?.send(JSON.stringify({
        type: "student-screen-offer",
        payload: offer,
        to: pendingScreenRequestRef.current,
      }));
      
      pendingScreenRequestRef.current = null;
    } catch (err) {
      console.error("Failed to share student screen:", err);
      declineScreenRequest();
    }
  }, [role]);

  const declineScreenRequest = useCallback(() => {
    if (pendingScreenRequestRef.current) {
      wsRef.current?.send(JSON.stringify({
        type: "decline-screen-request",
        teacherId: pendingScreenRequestRef.current,
      }));
      pendingScreenRequestRef.current = null;
    }
  }, []);

  const stopWatchingStudent = useCallback((studentId: string) => {
    const stream = studentStreams.find((s) => s.studentId === studentId);
    if (stream) {
      stream.pc.close();
      setStudentStreams((prev) => prev.filter((s) => s.studentId !== studentId));
    }
  }, [studentStreams]);

  return {
    isSharing,
    isReceiving,
    error,
    localStream: localStreamRef.current,
    remoteStream: remoteStreamRef.current,
    studentStreams,
    startScreenShare,
    stopScreenShare,
    requestStudentScreen,
    acceptScreenRequest,
    declineScreenRequest,
    stopWatchingStudent,
  };
}
