import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env } from './config/env.js';
import { healthCheck } from './db/knex.js';
import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/users.js';

const server = Fastify({ logger: true });

await server.register(cors, {
	origin: (origin, cb) => {
		const allowed = env.CORS_ORIGIN.split(',').map(s => s.trim()).filter(Boolean);
		if (!origin) return cb(null, true);
		const isAllowed = allowed.includes('*') || allowed.includes(origin);
		cb(isAllowed ? null : new Error('CORS not allowed'), isAllowed);
	},
	credentials: true,
});

server.get('/health', async () => ({ status: 'ok', db: await healthCheck() }));

await server.register(authRoutes, { prefix: '/api' });
await server.register(userRoutes, { prefix: '/api' });

const port = Number(env.PORT);
const host = env.HOST;

try {
	await server.listen({ port, host });
	server.log.info(`Server listening on http://${host}:${port}`);
} catch (err) {
	server.log.error(err);
	process.exit(1);
}
