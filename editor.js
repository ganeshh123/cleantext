/* Imports */
const customTitlebar = require('custom-electron-titlebar');
let titleBar
let macTitleBar

/* Adjustments for Mac */
if(process.platform === 'darwin'){
  bodyDOM = document.body
  macTitleBar = document.createElement("DIV");
  macTitleBar.innerText = 'CleanText'
  macTitleBar.id = 'macTitleBar'
  bodyDOM.prepend(macTitleBar)
}


/* Title Bar */
if(process.platform != 'darwin'){
  titleBar = new customTitlebar.Titlebar({
    backgroundColor: customTitlebar.Color.fromHex('#ffffff'),
    shadow: true
  });
  titleBar.updateTitle('CleanText');
}

const {ipcRenderer} = require('electron');

/* Display Document Content */
ipcRenderer.on('fileOpen:content', (e, data) => {
  document.getElementById('editor').innerHTML = data
});

/* Set file name */
ipcRenderer.on('fileOpen:name', (e, data) => {
  const titleText = data + ' - CleanText'
  if(process.platform === 'darwin'){
    document.getElementById('macTitleBar').innerText = titleText
  }
  titleBar.updateTitle(titleText)
});

/* Give document content to mainprocess to save to file */
ipcRenderer.on('requestSave', (e, data) => {
  documentData = document.getElementById('editor').innerHTML;
  ipcRenderer.send('fileSave:content', documentData)
});

/* Formats the text upon receiving a command */
ipcRenderer.on('formatCommand', (e, command) => {
    document.execCommand(command);
});


