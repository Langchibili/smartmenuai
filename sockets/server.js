const { Server } = require("socket.io");
const { io: ioClient } = require("socket.io-client");

const DEVICE_SERVER_URL = process.env.DEVICE_SOCKET_URL || "http://localhost:3008";
const io = new Server({ cors: { origin: "*" } });

// Outbound connection to device socket server for push forwarding
const deviceServer = ioClient(DEVICE_SERVER_URL, { autoConnect: true, reconnection: true });
deviceServer.on("connect", () => console.log("✅ Main server connected to device server"));
deviceServer.on("connect_error", (e) => console.error("Device server connect error:", e.message));

io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on("join_business_room", (businessId) => {
        if (businessId) {
            socket.join(`business_${businessId}`);
            console.log(`Socket ${socket.id} joined business_${businessId}`);
        }
    });

    socket.on("join_employee_room", (employeeId) => {
        if (employeeId) {
            socket.join(`employee_${employeeId}`);
        }
    });

    // ── Waiter calls ──────────────────────────────────────────────────────
    socket.on("waiter_calls_event", (payload) => {
        const d = payload.data || {};
        if (d.business_id) {
            io.to(`business_${d.business_id}`).emit("waiter_calls_event", payload);
        }
        // Forward to device server for push notification (background/native)
        deviceServer.emit("waiter_call:new", {
            ownerId: d.owner_id,
            waiterId: d.assigned_waiter_id,
            payload: d,
            eventType: payload.type,
        });
    });

    // ── Orders ────────────────────────────────────────────────────────────
    socket.on("orders_event", (payload) => {
        const d = payload.data || {};
        if (d.business_id) {
            io.to(`business_${d.business_id}`).emit("orders_event", payload);
        }
        const eventName = payload.type === "create" ? "order:new" : "order:status:updated";
        deviceServer.emit(eventName, {
            ownerId: d.owner_id,
            waiterId: d.waiter_id,
            payload: d,
        });
    });

    socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

io.listen(4000);
console.log("Socket server running on port 4000");