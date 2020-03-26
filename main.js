const { app, BrowserWindow, Menu, dialog } = require('electron')
require('electron-reload')(__dirname);
const fs = require ('fs');

/* Creates the Main Window of the Application */
function createMainWindow() {
    // Create the window window.
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        },

    })

    const appMenuTemplate = [{
            label: 'CleanText',
            submenu: [
                {label: 'Open', click: openFile, accelerator: 'CmdOrCtrl+O'}
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { label: 'Undo', role: 'undo' },
                { label: 'Redo', role: 'redo' },
                { label: 'Cut', role: 'cut' },
                { label: 'Copy', role: 'copy' },
                { label: 'Paste', role: 'paste' }
            ]
        }
    ]

    const appMenu = Menu.buildFromTemplate(appMenuTemplate)
    Menu.setApplicationMenu(appMenu)

    return win
}

app.whenReady().then(() => {

    win = createMainWindow()

    /* Load Editor File into Main Window */
    win.loadFile('editor.html')

})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }

})



const openFile = () => {
    
}