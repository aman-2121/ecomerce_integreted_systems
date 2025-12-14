// backend/src/server.ts
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { runMigrations } from './utils/migrationRunner';
import app from './app';
// Import models to initialize associations
import './models';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    console.log('Database connected successfully');

    // Run database migrations
    await runMigrations();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Admin API: http://localhost:${PORT}/api/admin/products`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

startServer();

export default app;