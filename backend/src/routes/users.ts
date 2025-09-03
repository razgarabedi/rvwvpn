import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getDb } from '../db/knex.js';
import { authenticate } from '../auth/jwt.js';

// Common FreeRADIUS schema assumptions:
// - radcheck: id, username, attribute, op, value
// - radusergroup: id, username, groupname, priority

const UserSchema = z.object({
	username: z.string().min(1),
	password: z.string().min(1),
	group: z.string().optional(),
});

export async function userRoutes(app: FastifyInstance) {
	app.addHook('preHandler', authenticate);

	app.get('/users', async () => {
		const db = getDb();
		const rows = await db('radcheck').select('username').where({ attribute: 'Cleartext-Password' }).groupBy('username');
		return rows.map(r => r.username);
	});

	app.get('/users/:username', async (req, reply) => {
		const username = (req.params as any).username as string;
		const db = getDb();
		const creds = await db('radcheck').where({ username, attribute: 'Cleartext-Password' }).first();
		const groups = await db('radusergroup').where({ username }).select('groupname', 'priority');
		if (!creds) return reply.code(404).send({ error: 'Not found' });
		return { username, hasPassword: !!creds, groups };
	});

	app.post('/users', async (req, reply) => {
		const parsed = UserSchema.safeParse(req.body);
		if (!parsed.success) return reply.code(400).send({ error: 'Invalid payload' });
		const { username, password, group } = parsed.data;
		const db = getDb();
		await db.transaction(async trx => {
			await trx('radcheck').insert({ username, attribute: 'Cleartext-Password', op: ':=', value: password });
			if (group) await trx('radusergroup').insert({ username, groupname: group, priority: 1 });
		});
		return reply.code(201).send({ ok: true });
	});

	app.put('/users/:username/password', async (req, reply) => {
		const username = (req.params as any).username as string;
		const body = z.object({ password: z.string().min(1) }).safeParse(req.body);
		if (!body.success) return reply.code(400).send({ error: 'Invalid payload' });
		const db = getDb();
		const updated = await db('radcheck')
			.update({ value: body.data.password })
			.where({ username, attribute: 'Cleartext-Password' });
		if (!updated) return reply.code(404).send({ error: 'Not found' });
		return { ok: true };
	});

	app.post('/users/:username/disable', async (req, reply) => {
		const username = (req.params as any).username as string;
		const db = getDb();
		await db('radcheck').insert({ username, attribute: 'Auth-Type', op: ':=', value: 'Reject' }).onConflict(['username', 'attribute']).merge();
		return { ok: true };
	});

	app.post('/users/:username/enable', async (req, reply) => {
		const username = (req.params as any).username as string;
		const db = getDb();
		await db('radcheck').where({ username, attribute: 'Auth-Type' }).del();
		return { ok: true };
	});

	app.delete('/users/:username', async (req) => {
		const username = (req.params as any).username as string;
		const db = getDb();
		await db.transaction(async trx => {
			await trx('radcheck').where({ username }).del();
			await trx('radusergroup').where({ username }).del();
		});
		return { ok: true };
	});
}
