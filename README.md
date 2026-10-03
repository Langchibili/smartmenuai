# Smart Menu AI

Smart Menu AI uses Next.js for the web app, Strapi 5 for the API, MySQL for
persistent data, and two Socket.IO services for browser and native-device
realtime events.

## Local services

Build and start the production applications from their project directories:

```powershell
cd frontend
npm run build
npm run start
```

The web app listens on port 3007. Build Strapi from `backend` with `npm run
build`, then start it with `npm run start` (port 1357). From `sockets`, start
the main and device Socket.IO services with `npm start` (port 4000) and
`npm run start:device` (port 3008).

The backend `.env` must select MySQL and provide valid connection credentials.
The frontend `.env` should point to the local API and main socket. Set the same
long, random `SOCKET_INTERNAL_TOKEN` in both `backend/.env` and `sockets/.env`;
see `sockets/.env.example`. The backend client and both socket services use
this token to authenticate internal event forwarding. Never expose it to the
frontend or native app. Use the machine's LAN address in the Expo app's
`EXPO_PUBLIC_*_URL` values when testing on a physical device.

The backend API role and route-action matrix is documented in
`backend-permissions-matrix.txt`. Configure matching Users & Permissions role
grants in Strapi and keep operational collection CRUD private.
