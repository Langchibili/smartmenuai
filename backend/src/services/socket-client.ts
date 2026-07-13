// // src/services/socket-client.ts
// import { io } from 'socket.io-client';

// // Connect Strapi to your dedicated Socket Server
// const socket = io(process.env.SOCKET_SERVER_URL || 'http://localhost:4000', {
//     autoConnect: true,
// });

// export default socket;
import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL || 'http://localhost:4000';

const socket = io(SOCKET_SERVER_URL, {
    autoConnect: true,
    reconnection: true,
});

socket.on('connect', () => {
    console.log(`Strapi Backend connected to Socket Server [${socket.id}]`);
});

export default socket;