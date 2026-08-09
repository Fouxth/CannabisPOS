import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyToken, JwtPayload } from '../middleware/auth';
import { managementPrisma } from '../lib/management-db';

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
        const allowedOrigins = process.env.CORS_ORIGIN
            ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
            : ['http://localhost:5173', 'http://localhost:3000'];

        this.io = new SocketIOServer(httpServer, {
            cors: {
                origin: allowedOrigins,
                methods: ["GET", "POST"],
                credentials: true,
            },
            transports: ['websocket', 'polling'],
        });

        // Middleware for Socket.IO authentication & tenant active verification
        this.io.use(async (socket, next) => {
            const token =
                socket.handshake.auth?.token ||
                socket.handshake.headers.authorization?.split(' ')[1];

            if (!token) {
                return next(new Error('Authentication error: Access token required'));
            }

            const payload = verifyToken(token);
            if (!payload) {
                return next(new Error('Authentication error: Invalid or expired token'));
            }

            // CRITICAL: Check if tenant is still active in DB
            if (payload.tenantId) {
                try {
                    const tenant = await managementPrisma.tenant.findUnique({
                        where: { id: payload.tenantId },
                        select: { isActive: true },
                    });

                    if (!tenant || !tenant.isActive) {
                        return next(new Error('Authentication error: Shop is inactive or suspended'));
                    }
                } catch (error) {
                    console.error('Socket auth tenant check error:', error);
                    return next(new Error('Internal server error during auth check'));
                }
            }

            socket.data.user = payload as JwtPayload;
            next();
        });

        this.io.on('connection', (socket) => {
            const user = socket.data.user as JwtPayload;
            console.log(`🔌 New authenticated socket connection: ${socket.id} (User: ${user?.username}, Tenant: ${user?.tenantId})`);

            // Automatically join verified tenant room & user room derived from JWT
            if (user?.tenantId) {
                const tenantRoom = `tenant_${user.tenantId}`;
                socket.join(tenantRoom);
                console.log(`👤 Socket ${socket.id} joined room: ${tenantRoom}`);
            }

            if (user?.id) {
                const userRoom = `user_${user.id}`;
                socket.join(userRoom);
            }

            // Secure room join handler (only allows joining own verified tenant room)
            socket.on('join_room', (data: { tenantId?: string, userId?: string }) => {
                if (data?.tenantId && data.tenantId === user?.tenantId) {
                    const roomName = `tenant_${user.tenantId}`;
                    socket.join(roomName);
                } else {
                    console.warn(`⚠️ Socket ${socket.id} attempted to join unauthorized room for tenant ${data?.tenantId}`);
                }
            });

            socket.on('disconnect', () => {
                console.log('🔌 Socket disconnected:', socket.id);
            });
        });
    }

    public sendNotification(tenantId: string, userId: string | null, notification: any) {
        if (!this.io) return;

        if (userId) {
            const userRoom = `user_${userId}`;
            this.io.to(userRoom).emit('notification_received', notification);
        } else {
            const tenantRoom = `tenant_${tenantId}`;
            this.io.to(tenantRoom).emit('notification_received', notification);
        }

        console.log(`📢 Emitted notification to tenant: ${tenantId}`);
    }
}

export const socketService = SocketService.getInstance();
