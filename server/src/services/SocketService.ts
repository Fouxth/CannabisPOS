import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

export class SocketService {
    private static instance: SocketService;
    private io: SocketIOServer | null = null;

    private constructor() { }

    public static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    public init(httpServer: HttpServer) {
        this.io = new SocketIOServer(httpServer, {
            cors: {
                origin: "*", // Adjust this for production
                methods: ["GET", "POST"]
            }
        });

        this.io.on('connection', (socket) => {
            console.log('🔌 New socket connection:', socket.id);

            // Join a room based on tenant and user
            socket.on('join_room', (data: { tenantId: string, userId: string }) => {
                if (data.tenantId) {
                    const roomName = `tenant_${data.tenantId}`;
                    socket.join(roomName);
                    console.log(`👤 User ${data.userId} joined room: ${roomName}`);
                }
            });

            socket.on('disconnect', () => {
                console.log('🔌 Socket disconnected:', socket.id);
            });
        });
    }

    public sendNotification(tenantId: string, userId: string | null, notification: any) {
        if (!this.io) return;

        const roomName = `tenant_${tenantId}`;

        // If userId is provided, we can target specific user if we implemented user-specific rooms
        // For now, let's broadcast to the whole tenant room if the notification is for all or if we want simplicity
        // Most in-app notifications in this POS seem to be store-wide or for the logged in user.

        this.io.to(roomName).emit('notification_received', notification);
        console.log(`📢 Emitted notification to room: ${roomName}`);
    }
}

export const socketService = SocketService.getInstance();
