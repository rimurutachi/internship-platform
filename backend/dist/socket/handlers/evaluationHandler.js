"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupEvaluationHandlers = void 0;
const setupEvaluationHandlers = (io, socket) => {
    const userId = socket.user?.id;
    // Join evaluation room (for specific internship / evaluation)
    socket.on("join_evaluation", (evaluationId) => {
        socket.join(`evaluation:${evaluationId}`);
        console.log(`User ${userId} joined evaluation ${evaluationId}`);
    });
    // Leave evaluation room
    socket.on("leave_evaluation", (evaluationId) => {
        socket.leave(`evaluation:${evaluationId}`);
        console.log(`User ${userId} left evaluation ${evaluationId}`);
    });
};
exports.setupEvaluationHandlers = setupEvaluationHandlers;
//# sourceMappingURL=evaluationHandler.js.map