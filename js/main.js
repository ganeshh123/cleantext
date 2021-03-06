/* Imports */
const { app, BrowserWindow, Menu, dialog, ipcMain, Tray} = require('electron')
const fs = require ('fs')
const showdown  = require('showdown')
const jsdom = require('jsdom')
const { plugin } = require('electron-frameless-window-plugin')
const path = require('path');
const join = require('path').join;
const openAboutWindow = require('about-window').default;


/* App Variables */
const converter = new showdown.Converter({tables: true, underline: true})
const isMac = process.platform === 'darwin'
const jsDom = new jsdom.JSDOM();
let win;

/* Creates the Main Window of the Application */
function createMainWindow() {
    // Create the window window.
    win = new BrowserWindow({
        width: 800,
        height: 600,
        frame: isMac ? true: false,
        transparent: !isMac,
        fullscreen: false,
        titleBarStyle: 'hidden',
        webPreferences: {
            nodeIntegration: true
        },
        icon: path.join(__dirname, '../assets/cleantext_icon.png')
    })

    let appMenuTemplate = [{
            label: 'File',
            submenu: [
                {label: 'Open', click: openFile, accelerator: 'CmdOrCtrl+O'},
                {label: 'Save', click: saveRequest, accelerator: 'CmdOrCtrl+S'},
                {label: 'About CleanText', click: showAbout},
                {label: 'Exit', role: 'quit', accelerator: isMac ? 'Cmd+Q' : 'Alt+F4'}
            ]
        },
        {
            label: 'Edit',
            submenu: [
                {label: 'Undo',  click: focusAndPerform('undo'),  accelerator: 'CmdOrCtrl+Z'},
                {label: 'Redo',  click: focusAndPerform('redo'),  accelerator: 'CmdOrCtrl+Y'},
                { type: 'separator' },
                {label: 'Cut',  click: focusAndPerform('cut'),  accelerator: 'CmdOrCtrl+X'},
                {label: 'Copy',  click: focusAndPerform('copy'),  accelerator: 'CmdOrCtrl+C'},
                {label: 'Paste',  click: focusAndPerform('paste'),  accelerator: 'CmdOrCtrl+V'},
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
                  {label: 'Delete',  click: focusAndPerform('delete')},
                  { type: 'separator' },
                  {label: 'Select All',  click: focusAndPerform('selectAll'),  accelerator: 'CmdOrCtrl+A'}
                ])
            ]
        },
        {
            label: 'Format',
            submenu: [
              {label: 'Bold', click: () => {sendFormatCommand('bold')}, accelerator: 'CmdOrCtrl+B'},
              {label: 'Underline', click: () => {sendFormatCommand('underline')}, accelerator: 'CmdOrCtrl+U'},
              {label: 'Italic', click: () => {sendFormatCommand('italic')}, accelerator: 'CmdOrCtrl+I'},
              { type: 'separator' },
              {label: 'Large Title', click: () => {sendFormatCommandWithArgs('formatBlock', '<h1>')}, accelerator: 'CmdOrCtrl+1'},
              {label: 'Small Title', click: () => {sendFormatCommandWithArgs('formatBlock', '<h2>')}, accelerator: 'CmdOrCtrl+2'},
              {label: 'Subtitle', click: () => {sendFormatCommandWithArgs('formatBlock', '<h3>')}, accelerator: 'CmdOrCtrl+3'},
              {label: 'Paragraph', click: () => {sendFormatCommandWithArgs('formatBlock', '<p>')}, accelerator: 'CmdOrCtrl+4'},
              { type: 'separator' },
              {label: 'Bullet List', click: () => {sendFormatCommand('insertUnorderedList')}, accelerator: 'CmdOrCtrl+L'},
              {label: 'Numbered List', click: () => {sendFormatCommand('insertOrderedList')}, accelerator: 'CmdOrCtrl+N'},
              { type: 'separator' },
              {label: 'Clear Formatting', click: () => {sendFormatCommand('removeFormat')}, accelerator: 'CmdOrCtrl+0'},
            ]
        }
    ]

    /* Enable Developer Tools when not in Production */
    if(process.env.NODE_ENV != 'production'){
        appMenuTemplate[0].submenu.splice(3, 0,
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
    win.loadFile(path.join(__dirname, '../html/editor.html'))

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
    //if (process.platform !== 'darwin') {
        app.quit()
    //}
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow()
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

    if(!isMac){
        filenameSplit = filenames[0].split('\\')
    }else{
        filenameSplit = filenames[0].split('/')
    }
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

/* Sends a command to the editor renderer to format the text */
const sendFormatCommand = (command) => {
    win.webContents.send('formatCommand', command)
}

/* Sends a command to the editor renderer to format the text with arguments */
const sendFormatCommandWithArgs = (command, arguments) => {
    win.webContents.send('formatCommandWithArgs',{command, arguments})
}

/* Lets user save files to storage */
ipcMain.on('fileSave:content', function(e, data){
    documentText = converter.makeMarkdown(data, jsDom.window.document)
    
    const filename = dialog.showSaveDialogSync(win, {
        properties: ['saveFile'],
        filters: [
            {name: 'Markdown Document', extensions: ['md', 'markdown']},
            {name: 'Text File', extensions: ['txt']}
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
        if(!isMac){
            filenameSplit = filename.split('\\')
        }else{
            filenameSplit = filename.split('/')
        }
        win.webContents.send('fileSaved:name', filenameSplit[filenameSplit.length -1])
    })
})

/* Fix for Windows */
function focusAndPerform(methodName) {
    return function(menuItem, window) {
        window.webContents.focus()
        window.webContents[methodName]()
      }
}

/* Show About Information */
const showAbout = () => {
    openAboutWindow({
        icon_path: path.join(__dirname, '../assets/cleantext_icon.png'),
        //open_devtools: process.env.NODE_ENV !== 'production',
        about_page_dir: path.join(__dirname, '../html/'),
        show_close_button: 'Close',
        win_options: {
            frame: false,
            transparent: !isMac,
            fullscreen: false
        }
    })
}