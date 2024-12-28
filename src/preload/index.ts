import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
import sqlClient from 'Main/db/client';
import { Theme, WindowName } from 'App/types';

const { getUserInfo, setUserTheme } = sqlClient;

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    const { locale, message } = ipcRenderer.sendSync('locale-data');
    let UserInfo = await sqlClient.getUserInfo();
    ipcRenderer.send('native-theme:init', UserInfo.theme ? UserInfo.theme : Theme.system);

    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('Context', {
      platform: process.platform,
      NODE_ENV: process.env.NODE_ENV,
      ROOT_PATH: window.location.href.startsWith('file') ? '../../' : '/',
      getUserInfo: () => UserInfo,
      updateUserInfo: (userInfo: DB.UserAttributes) => {
        UserInfo = { ...userInfo };
      },
      windowOpen: (args: Windows.Args) => ipcRenderer.send('window:open', args),
      windowClose: (name: WindowName) => ipcRenderer.send('window:close', name),
      getUserTheme: (): Theme => ipcRenderer.sendSync('native-theme:get_user'),
      getSystemTheme: (): Exclude<Theme, 'system'> =>
        ipcRenderer.sendSync('native-theme:get_system'),
      themeSetting: (theme: Theme) => ipcRenderer.send('native-theme:setting', theme),
      // The value of theme setting is system. just change app theme, not to change value of setting.
      themeChangedListener: (fn: ThemeChangedListenerFN) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ipcRenderer.on('native-theme:changed', (_event: unknown) => {
          fn();
        });
      },
      // from setting
      themeSettingListener: (fn: ThemeSettingListenerFN) => {
        ipcRenderer.on('native-theme:setting', (_event, theme: Theme) => {
          fn(theme);
        });
      },
      locale,
      localeMessages: message,
      sqlClient: {
        getUserInfo,
        setUserTheme
      }
    });
    console.log('preload complete');
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
