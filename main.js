/* Imports */
const { app, BrowserWindow, Menu, dialog, ipcMain} = require('electron')
const fs = require ('fs')
const showdown  = require('showdown')
const jsdom = require('jsdom')
const { plugin } = require('electron-frameless-window-plugin')

/* App Variables */
const converter = new showdown.Converter()
const isMac = process.platform === 'darwin'
const jsDom = new jsdom.JSDOM();

/* Creates the Main Window of the Application */
function createMainWindow() {
    // Create the window window.
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        frame: isMac,
        transparent: !isMac,
        fullscreen: false,
        titleBarStyle: 'hidden',
        webPreferences: {
            nodeIntegration: true
        },
        
    })

    let appMenuTemplate = [{
            label: 'CleanText',
            submenu: [
                {label: 'Open', click: openFile, accelerator: 'CmdOrCtrl+O'},
                {label: 'Save', click: saveRequest, accelerator: 'CmdOrCtrl+S'},
                {label: 'Exit', role: 'quit', accelerator: isMac ? 'Cmd+Q' : 'Alt+F4'}
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                ...(isMac ? [
                  { role: 'pasteAndMatchStyle' },
                  { role: 'delete' },
                  { role: 'selectAll' },
                  { type: 'separator' },
                  {
                    label: 'Speech',
                    submenu: [
                      { role: 'startspeaking' },
                      { role: 'stopspeaking' }
                    ]
                  }
                ] : [
                  { role: 'delete' },
                  { type: 'separator' },
                  { role: 'selectAll' }
                ])
            ]
        },
        {
            label: 'View',
            submenu: [
              { role: 'zoomin' },
              { role: 'zoomout' },
              { role: 'resetzoom' },
              { type: 'separator' },
              //{ role: 'togglefullscreen' }
            ]
        }
    ]

    /* Enable Developer Tools when not in Production */
    if(process.env.NODE_ENV != 'production'){
        appMenuTemplate[0].submenu.splice(2, 0,
            {
                label: 'Developer',
                click(item, focusedWindow){
                    focusedWindow.toggleDevTools();
                },
                accelerator: isMac ? 'Cmd+Shift+I' : 'F12'
            }
        )
    }

    const appMenu = Menu.buildFromTemplate(appMenuTemplate)
    Menu.setApplicationMenu(appMenu)

    //Quit when closed
    win.on('closed', () => {
        app.quit
    })

    return win
}

app.whenReady().then(() => {

    win = createMainWindow()

    /* Load Editor File into Main Window */
    win.loadFile('editor.html')

})

if(!isMac){
    plugin({
        setGlobal: true
      })
}

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


/* APP FUNCTIONS */

/* Reads file from filesystem and opens in editor */
const openFile = () => {

    const filenames = dialog.showOpenDialogSync(win, {
        properties: ['openFile'],
        filters: [
            {name: 'Documents', extensions: ['txt', 'md', 'markdown']}
        ]
    })
    if(!filenames){
        return;
    }

    filenameSplit = filenames[0].split('\\')
    win.webContents.send('fileOpen:name', filenameSplit[filenameSplit.length -1])

    fs.readFile(filenames[0], 'utf8', (err, data) => {
        if(err){
            throw err
        }

        win.webContents.send('fileOpen:content', converter.makeHtml(data))
    })
}

/* Requests the editor to return document
    in html format to save to storage */
const saveRequest = () => {
    win.webContents.send('requestSave', {})
}

/* Lets user save files to storage */
ipcMain.on('fileSave:content', function(e, data){
    documentText = converter.makeMarkdown(data, jsDom.window.document)
    
    const filename = dialog.showSaveDialogSync(win, {
        properties: ['saveFile'],
        filters: [
            {name: 'Documents', extensions: ['md', 'markdown']}
        ]
    })
    if(!filename){
        console.log('Save Dialog Cancelled')
        return
    }

    fs.writeFile(filename, documentText, function(err){
        if(err){
            throw err
        }
        console.log('File Saved!')
    })
})
