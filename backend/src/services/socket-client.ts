// // src/services/socket-client.ts
// import { io } from 'socket.io-client';

// // Connect Strapi to your dedicated Socket Server
// const socket = io(process.env.SOCKET_SERVER_URL || 'http://localhost:4000', {
//     autoConnect: true,
// });

// export default socket;
import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL || 'http://localhost:4000';
const SOCKET_INTERNAL_TOKEN = process.env.SOCKET_INTERNAL_TOKEN;

const socket = io(SOCKET_SERVER_URL, {
    autoConnect: true,
    reconnection: true,
    auth: SOCKET_INTERNAL_TOKEN ? { internalToken: SOCKET_INTERNAL_TOKEN } : {},
});

socket.on('connect', () => {
    console.log(`Strapi Backend connected to Socket Server [${socket.id}]`);
    if (!SOCKET_INTERNAL_TOKEN) {
        console.error('SOCKET_INTERNAL_TOKEN is unset; backend realtime events will be rejected');
    }
});

export default socket;