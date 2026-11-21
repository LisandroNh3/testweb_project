import { env } from './config/env.js';
import { prisma } from './config/prisma.js';
import { app } from './app.js';

const iniciar = async () => {
  try {
    await prisma.$connect();
    const server = app.listen(env.port, () => {
      console.log(`API Coffee Click escuchando en http://localhost:${env.port}/api/v1`);
    });

    const apagar = async () => {
      server.close();
      await prisma.$disconnect();
      process.exit(0);
    };
    process.on('SIGINT', apagar);
    process.on('SIGTERM', apagar);
  } catch (error) {
    console.error('No se pudo conectar a la base de datos. Revise DATABASE_URL en backend/.env');
    console.error(error.message);
    process.exit(1);
  }
};

iniciar();
