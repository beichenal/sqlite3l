import { ipcRenderer } from 'electron';
import { LogFunctions } from 'electron-log';
type Log = LogFunctions;

class Logging {
  private static instance: Logging;

  private logger: Log;

  constructor() {
    this.logger = {
      error: this.error,
      warn: this.warn,
      info: this.info,
      verbose: this.verbose,
      debug: this.debug,
      silly: this.silly,
      log: this.log
    };
  }

  public static getInstance(): Logging {
    if (!Logging.instance) Logging.instance = new Logging();
    return Logging.instance;
  }

  public getLogger(): LogFunctions {
    return this.logger;
  }

  private send = (name: keyof Log, ...args: unknown[]): void => {
    ipcRenderer.send('app-log-event', name, args);
  };

  private error: LogFunctions['error'] = (...params) => {
    this.send('error', params);
  };
  private warn: LogFunctions['warn'] = (...params) => {
    this.send('warn', params);
  };
  private info: LogFunctions['info'] = (...params) => {
    this.send('info', params);
  };
  private verbose: LogFunctions['verbose'] = (...params) => {
    this.send('verbose', params);
  };
  private debug: LogFunctions['debug'] = (...params) => {
    this.send('debug', params);
  };
  private silly: LogFunctions['silly'] = (...params) => {
    this.send('silly', params);
  };
  private log: LogFunctions['log'] = (...params) => {
    this.send('log', params);
  };
}

export default function (): Logging {
  return Logging.getInstance();
}
