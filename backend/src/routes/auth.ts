import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { signAdminJWT } from '../auth/jwt.js';

const LoginSchema = z.object({ username: z.string(), password: z.string() });

export async function authRoutes(app: FastifyInstance) {
	app.post('/auth/login', async (req, reply) => {
		const parsed = LoginSchema.safeParse(req.body);
		if (!parsed.success) return reply.code(400).send({ error: 'Invalid payload' });
		const { username, password } = parsed.data;

		const adminUser = process.env.ADMIN_USERNAME || 'admin';
		const adminPassHash = process.env.ADMIN_PASSWORD_HASH;
		const adminPass = process.env.ADMIN_PASSWORD;

		let isValid = false;
		if (adminPassHash) {
			isValid = await bcrypt.compare(password, adminPassHash);
		} else if (adminPass) {
			isValid = password === adminPass;
		}

		if (username !== adminUser || !isValid) {
			return reply.code(401).send({ error: 'Invalid credentials' });
		}

		const token = signAdminJWT(username);
		return { token };
	});
}
