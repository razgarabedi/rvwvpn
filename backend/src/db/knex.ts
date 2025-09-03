import knex, { Knex } from 'knex';
import { env } from '../config/env.js';

let knexInstance: Knex | null = null;

export function getDb(): Knex {
	if (!knexInstance) {
		knexInstance = knex({
			client: env.DB_CLIENT,
			connection: {
				host: env.DB_HOST,
				port: Number(env.DB_PORT),
				user: env.DB_USER,
				password: env.DB_PASSWORD,
				database: env.DB_NAME,
			},
			pool: { min: 0, max: 10 },
		});
	}
	return knexInstance;
}

export async function healthCheck(): Promise<boolean> {
	try {
		await getDb().raw('select 1');
		return true;
	} catch {
		return false;
	}
}
