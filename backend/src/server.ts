import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;


// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true 
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb'}));
app.use(express.urlencoded({ extended: true}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Intern-Galing API is running smoothly.'});
});

// Error Handling Middleware
app.use((err: any, req: any, res: any, next: any) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong.'})
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;