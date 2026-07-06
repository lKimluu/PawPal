import pg from 'pg'

const { Pool } = pg

export function createPoolConfigFromEnv(env = process.env) {
  return {
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
    ssl: {
      rejectUnauthorized: false,
    },
  }
}

export function createPoolFromEnv(env = process.env) {
  return new Pool(createPoolConfigFromEnv(env))
}
