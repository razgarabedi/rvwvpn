import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const EnvSchema = z.object({
	PORT: z.string().default('4000'),
	HOST: z.string().default('0.0.0.0'),
	CORS_ORIGIN: z.string().default('*'),
	DB_CLIENT: z.enum(['mysql2', 'pg']).default('mysql2'),
	DB_HOST: z.string(),
	DB_PORT: z.string().default('3306'),
	DB_USER: z.string(),
	DB_PASSWORD: z.string(),
	DB_NAME: z.string(),
	JWT_SECRET: z.string().min(16),
});

export type AppEnv = z.infer<typeof EnvSchema>;

export const env: AppEnv = EnvSchema.parse(process.env);
