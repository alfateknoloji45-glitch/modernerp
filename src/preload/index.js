import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// React'in kullanacağı API'ler
const api = {
  // Veritabanı Fonksiyonları
  set: (key, value) => ipcRenderer.send('db-set', key, value),
  get: (key) => ipcRenderer.invoke('db-get', key),
  delete: (key) => ipcRenderer.send('db-delete', key)
}

// Yazdırma / PDF API
const printApi = {
  toPDF: (html, filename, options) => ipcRenderer.invoke('print-to-pdf', { html, filename, options })
}

const systemApi = {
  clearCache: () => ipcRenderer.invoke('clear-cache')
}
systemApi.saveText = (content, filename, filters) => ipcRenderer.invoke('save-text-file', { content, filename, filters })
systemApi.openText = (filters) => ipcRenderer.invoke('open-text-file', { filters })

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('db', api) // 'db' adında köprü açtık
    contextBridge.exposeInMainWorld('print', printApi)
    contextBridge.exposeInMainWorld('system', systemApi)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.db = api
  window.print = printApi
  window.system = systemApi
}
