import { ServerInterface } from './types';
import { Database, Statement } from 'better-sqlite3';
import SQL from 'better-sqlite3-multiple-ciphers';
import { ensureDirSync, removeSync } from 'fs-extra';
import { consoleLogger } from 'App/utils/consoleLogger';
import { getSchemaVersion, getUserVersion, setUserVersion } from './util';

const user_id_key = 1;

let globalInstance: Database | undefined;
const logger = consoleLogger;
let databaseFilePath: string | undefined;
type DatabaseQueryCache = Map<string, Statement<Array<unknown>>>;
const statementCache = new WeakMap<Database, DatabaseQueryCache>();

function prepare<T extends unknown[]>(db: Database, query: string): Statement<T> {
  let dbCache = statementCache.get(db);
  if (!dbCache) {
    dbCache = new Map();
    statementCache.set(db, dbCache);
  }

  let result = dbCache.get(query) as Statement<T>;

  if (!result) {
    result = db.prepare<T>(query);
    dbCache.set(query, result);
  }
  return result;
}

function keyDatabase(db: Database, key: string): void {
  db.pragma(`cipher='sqlcipher'`);
  db.pragma(`legacy=4`);
  db.pragma(`key='${key}'`);
}

function switchToWAL(db: Database): void {
  // https://sqlite.org/wal.html
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = FULL');
  db.pragma('fullfsync = ON');
}

function migrateSchemaVersion(db: Database): void {
  const userVersion = getUserVersion(db);

  if (userVersion > 0) return;

  const schemaVersion = getSchemaVersion(db);
  const newUserVersion = schemaVersion;
  logger.info(
    'migrateSchemaVersion: Migrating from schema_version ' +
      `${schemaVersion} to user_version ${newUserVersion}`
  );

  setUserVersion(db, newUserVersion);
}

function openAndMigrateDatabase(filePath: string, key: string): Database | undefined {
  let db: Database | undefined;

  try {
    db = new SQL(filePath);
    keyDatabase(db, key);
    switchToWAL(db);
    migrateSchemaVersion(db);

    return db;
  } catch (error) {
    logger.error(error);
    if (db) db.close();

    logger.info('migrateDatabase: Migration without cipher change failed');
    throw new Error('migrateDatabase: Migration without cipher change failed');
  }
}

const dataInterface: ServerInterface = {
  close,
  removeDB,

  // user
  updateOrCreateUser,
  getUserInfo,
  setUserTheme
};

async function close(): Promise<void> {
  globalInstance?.pragma('optimize');
  globalInstance?.close();
  globalInstance = undefined;
}

async function removeDB(): Promise<void> {
  if (globalInstance) {
    try {
      globalInstance.close();
    } catch (error) {
      logger.error('removeDB: Failed to close database:', error.stack);
    }
    globalInstance = undefined;
  }

  if (!databaseFilePath)
    throw new Error('removeDB: Cannot erase database without a databaseFilePath!');

  logger.warn('removeDB: Removing all database files');
  removeSync(databaseFilePath);
  removeSync(`${databaseFilePath}-shm`);
  removeSync(`${databaseFilePath}-wal`);
}

function getInstance(): Database {
  if (!globalInstance) {
    throw new Error('getInstance: globalInstance not set!');
  }

  return globalInstance;
}
