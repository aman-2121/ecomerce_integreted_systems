import { Sequelize } from 'sequelize';
import fs from 'fs';
import path from 'path';
import sequelize from '../config/database';

export const runMigrations = async (): Promise<void> => {
  try {
    console.log('🔄 Running database migrations...');

    // Create migrations table if it doesn't exist
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
        "name" VARCHAR(255) NOT NULL UNIQUE,
        PRIMARY KEY ("name")
      );
    `);

    // Get all migration files
    const migrationsPath = path.join(__dirname, '../../migrations');
    const migrationFiles = fs.readdirSync(migrationsPath)
      .filter(file => file.endsWith('.js'))
      .sort();

    // Get already run migrations
    const [results] = await sequelize.query('SELECT name FROM "SequelizeMeta"');
    const runMigrations = (results as any[]).map(row => row.name);

    // Run pending migrations
    for (const file of migrationFiles) {
      if (!runMigrations.includes(file)) {
        console.log(`📝 Running migration: ${file}`);

        const migration = require(path.join(migrationsPath, file));
        await migration.up(sequelize.getQueryInterface(), Sequelize);

        // Mark migration as run
        await sequelize.query('INSERT INTO "SequelizeMeta" ("name") VALUES (?)', {
          replacements: [file]
        });

        console.log(`✅ Migration ${file} completed`);
      }
    }

    console.log('✅ All migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
};
