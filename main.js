/* Imports */
const { app, BrowserWindow, Menu, dialog} = require('electron')
const fs = require ('fs');
const showdown  = require('showdown')

/* App Variables */
const converter = new showdown.Converter();
const isMac = process.platform === 'darwin'

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

    let appMenuTemplate = [{
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

    if()

    /* Enable Developer Tools when not in Production */
    if(process.env.NODE_ENV != 'production'){
        appMenuTemplate[0].submenu.push(
            {
                label: 'Developer',
                click(item, focusedWindow){
                    focusedWindow.toggleDevTools();
                },
                accelerator: 'F12'
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

/* Reads text file from filesystem and opens in editor */
const openFile = () => {

    const filenames = dialog.showOpenDialogSync(win, {
        properties: ['openFile'],
        filters: [
            {name: 'Documents', extensions: ['txt', 'md']}
        ]
    })
    if(!filenames){
        return;
    }

    fs.readFile(filenames[0], 'utf8', (err, data) => {
        if(err){
            throw err
        }

        win.webContents.send('fileOpen:content', converter.makeHtml(data))
        
    })
}
