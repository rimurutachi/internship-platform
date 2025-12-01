"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketHandlers = void 0;
const messageHandler_1 = require("./handlers/messageHandler");
const notificationHandler_1 = require("./handlers/notificationHandler");
const evaluationHandler_1 = require("./handlers/evaluationHandler");
const studentHandler_1 = require("./handlers/studentHandler");
const setupSocketHandlers = (io) => {
    io.on("connection", (socket) => {
        const userId = socket.user?.id;
        const userEmail = socket.user?.email;
        const userRole = socket.user?.role;
        console.log(`User connected: ${userEmail} (${userId}) - Role: ${userRole}`);
        // Setup handlers for different features
        (0, messageHandler_1.setupMessageHandlers)(io, socket);
        (0, notificationHandler_1.setupNotificationHandlers)(io, socket);
        (0, evaluationHandler_1.setupEvaluationHandlers)(io, socket);
        // Setup student-specific handlers if user is a student
        if (userRole === 'student') {
            (0, studentHandler_1.setupStudentHandlers)(io, socket);
        }
        // Handle disconnection
        socket.on("disconnect", (reason) => {
            console.log(`User disconnected: ${userEmail} - Reason: ${reason}`);
        });
        // Handle errors
        socket.on("error", (error) => {
            console.error(`Socket error for user ${userEmail}: `, error);
        });
    });
};
exports.setupSocketHandlers = setupSocketHandlers;
//# sourceMappingURL=socketHandler.js.map