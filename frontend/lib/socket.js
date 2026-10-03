import { io } from "socket.io-client";
import { getToken } from "./api";

let socket;
let socketAuthToken;

function getSocketUrl() {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) return process.env.NEXT_PUBLIC_SOCKET_URL;

  try {
    const url = new URL(process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1357");
    url.port = "4000";
    url.pathname = "";
    return url.origin;
  } catch {
    return "http://localhost:4000";
  }
}

export function getSocket() {
  if (!socket) {
    socket = io(getSocketUrl(), {
      autoConnect: false,
      reconnection: true,
      transports: ["websocket", "polling"],
      auth: {},
    });
  }
  return socket;
}

export function joinBusinessRoom(businessId) {
  if (!businessId) return () => {};

  const client = getSocket();
  const join = () => client.emit("join_business_room", businessId);
  const token = getToken();
  if (socketAuthToken !== token) {
    socketAuthToken = token;
    client.auth = { token };
    if (client.connected) client.disconnect();
  }
  client.on("connect", join);
  if (!client.connected) client.connect();
  if (client.connected) join();

  return () => {
    client.off("connect", join);
    if (client.connected) client.emit("leave_business_room", businessId);
  };
}

export function disconnectSocket() {
  if (!socket) return;
  socketAuthToken = null;
  socket.disconnect();
}

export function joinEmployeeRoom(userId) {
  if (!userId) return () => {};

  const client = getSocket();
  const join = () => client.emit("join_employee_room", userId);
  const token = getToken();
  if (socketAuthToken !== token) {
    socketAuthToken = token;
    client.auth = { token };
    if (client.connected) client.disconnect();
  }
  client.on("connect", join);
  if (!client.connected) client.connect();
  if (client.connected) join();

  return () => {
    client.off("connect", join);
  };
}

export function subscribeBusinessActivity(listener, businessId) {
  const client = getSocket();
  const events = ["orders_event", "waiter_calls_event", "table_status_updated", "notification:new"];
  const handlers = events.map((event) => {
    const handler = (payload) => listener(event, payload);
    client.on(event, handler);
    return [event, handler];
  });
  return () => {
    handlers.forEach(([event, handler]) => client.off(event, handler));
  };
}