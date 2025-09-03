import jwt from 'jsonwebtoken';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { env } from '../config/env.js';

export type JwtPayload = {
	role: 'admin';
	sub: string;
	iat: number;
	exp: number;
};

export function signAdminJWT(subject: string): string {
	return jwt.sign({ role: 'admin' }, env.JWT_SECRET, {
		subject,
		expiresIn: '8h',
	});
}

export function verifyJWT(token: string): JwtPayload {
	return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
	const header = request.headers['authorization'] || '';
	const [, token] = header.split(' ');
	if (!token) {
		return reply.code(401).send({ error: 'Missing token' });
	}
	try {
		const payload = verifyJWT(token);
		if (payload.role !== 'admin') {
			return reply.code(403).send({ error: 'Forbidden' });
		}
		(request as any).user = { username: payload.sub };
	} catch {
		return reply.code(401).send({ error: 'Invalid token' });
	}
}
