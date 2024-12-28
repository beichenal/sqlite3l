import { ServerInterface } from './types';
import {Database} from ''

const user_id_key = 1;

let globalInstance: Database | undefined;
const logger = consoleLogger;
let databaseFilePath: string | undefined;

const dataInterface: ServerInterface = {
  close,
  removeDB,

  // user
  updateOrCreateUser,
  getUserInfo,
  setUserTheme
};

async function close(): Promise<void> {
  globalInstance?.
}
