const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('olhoDesktop', Object.freeze({
  isDesktop: true,
  appName: 'Olho de Hórus'
}));
