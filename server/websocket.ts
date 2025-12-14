import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";

interface ScreenShareClient {
  ws: WebSocket;
  id: string;
  role: "teacher" | "student";
  userId?: string;
  classe?: string;
}

interface SignalMessage {
  type: "offer" | "answer" | "ice-candidate" | "start-share" | "stop-share" | "request-student-screen" | "student-screen-offer" | "student-screen-answer" | "student-screen-ice";
  payload: any;
  from?: string;
  to?: string;
  targetClasses?: string[];
}

const clients = new Map<string, ScreenShareClient>();
let teacherShareActive = false;
let teacherShareTargetClasses: string[] = [];
let currentTeacherId: string | null = null;

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ 
    server, 
    path: "/ws/screenshare" 
  });

  wss.on("connection", (ws: WebSocket) => {
    const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleMessage(clientId, ws, message);
      } catch (error) {
        console.error("WebSocket message parse error:", error);
      }
    });

    ws.on("close", () => {
      const client = clients.get(clientId);
      if (client?.role === "teacher" && client.userId === currentTeacherId) {
        teacherShareActive = false;
        currentTeacherId = null;
        broadcastToStudents({ type: "stop-share", payload: {} });
      }
      clients.delete(clientId);
    });

    ws.send(JSON.stringify({ type: "connected", clientId }));
  });

  function handleMessage(clientId: string, ws: WebSocket, message: any) {
    switch (message.type) {
      case "register":
        clients.set(clientId, {
          ws,
          id: clientId,
          role: message.role,
          userId: message.userId,
          classe: message.classe,
        });
        
        if (message.role === "student" && teacherShareActive) {
          if (message.classe && teacherShareTargetClasses.includes(message.classe)) {
            ws.send(JSON.stringify({ 
              type: "teacher-sharing", 
              payload: { active: true, teacherId: currentTeacherId } 
            }));
          }
        }
        break;

      case "start-share":
        const teacherClient = clients.get(clientId);
        if (teacherClient?.role === "teacher") {
          teacherShareActive = true;
          teacherShareTargetClasses = message.targetClasses || [];
          currentTeacherId = teacherClient.userId || clientId;
          
          broadcastToStudents({
            type: "teacher-sharing",
            payload: { active: true, teacherId: currentTeacherId },
          }, teacherShareTargetClasses);
        }
        break;

      case "stop-share":
        const stopClient = clients.get(clientId);
        if (stopClient?.role === "teacher") {
          teacherShareActive = false;
          currentTeacherId = null;
          teacherShareTargetClasses = [];
          broadcastToStudents({ type: "stop-share", payload: {} });
        }
        break;

      case "offer":
        broadcastToStudents({
          type: "offer",
          payload: message.payload,
          from: clientId,
        }, teacherShareTargetClasses);
        break;

      case "answer":
        if (message.to) {
          sendToClient(message.to, {
            type: "answer",
            payload: message.payload,
            from: clientId,
          });
        }
        break;

      case "ice-candidate":
        if (message.to) {
          sendToClient(message.to, {
            type: "ice-candidate",
            payload: message.payload,
            from: clientId,
          });
        } else {
          broadcastToStudents({
            type: "ice-candidate",
            payload: message.payload,
            from: clientId,
          }, teacherShareTargetClasses);
        }
        break;

      case "request-student-screen":
        if (message.studentId) {
          for (const [id, client] of clients) {
            if (client.userId === message.studentId) {
              client.ws.send(JSON.stringify({
                type: "screen-request",
                payload: { teacherId: clientId },
              }));
              break;
            }
          }
        }
        break;

      case "student-screen-offer":
        if (message.to) {
          sendToClient(message.to, {
            type: "student-screen-offer",
            payload: message.payload,
            from: clientId,
            studentId: clients.get(clientId)?.userId,
          });
        }
        break;

      case "student-screen-answer":
        if (message.to) {
          sendToClient(message.to, {
            type: "student-screen-answer",
            payload: message.payload,
            from: clientId,
          });
        }
        break;

      case "student-screen-ice":
        if (message.to) {
          sendToClient(message.to, {
            type: "student-screen-ice",
            payload: message.payload,
            from: clientId,
          });
        }
        break;

      case "decline-screen-request":
        if (message.teacherId) {
          sendToClient(message.teacherId, {
            type: "student-declined",
            payload: { studentId: clients.get(clientId)?.userId },
          });
        }
        break;
    }
  }

  function broadcastToStudents(message: any, targetClasses?: string[]) {
    for (const [, client] of clients) {
      if (client.role === "student") {
        if (!targetClasses || targetClasses.length === 0 || 
            (client.classe && targetClasses.includes(client.classe))) {
          try {
            client.ws.send(JSON.stringify(message));
          } catch (error) {
            console.error("Failed to send to student:", error);
          }
        }
      }
    }
  }

  function sendToClient(clientId: string, message: any) {
    const client = clients.get(clientId);
    if (client) {
      try {
        client.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error("Failed to send to client:", error);
      }
    }
  }

  return wss;
}
