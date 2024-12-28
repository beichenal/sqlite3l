import { Theme } from 'App/types';

import type { LogFunctions } from 'electron-log';

export type DataInterface = {
  close: () => Promise<void>;
  removeDB: () => Promise<void>;
  // user
  updateOrCreateUser: (users: DB.UserAttributes) => Promise<void>;
  getUserInfo: () => Promise<DB.UserAttributes>;
  setUserTheme: (theme: Theme) => Promise<unknown>;

  // TODO
};

export type ClientInterface = DataInterface & {
  // Client-side only

  shutdown: () => Promise<void>;
};

export type ServerInterface = DataInterface & {
  // Server-side only

  initialize: (options: {
    configDir: string;
    key: string;
    logger: Omit<LogFunctions, 'log'>;
  }) => Promise<void>;
};
