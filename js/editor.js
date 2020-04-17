/* Imports */
const customTitlebar = require('custom-electron-titlebar');
let titleBar
let macTitleBar
require('jquery')
require('hammerjs')
require('materialize-css')

/* Variables */
let selectionRange;

/* Adjustments for Mac */
if(process.platform === 'darwin'){
  bodyDOM = document.body
  macTitleBar = document.createElement("DIV");
  macTitleBar.innerText = 'CleanText'
  macTitleBar.id = 'macTitleBar'
  bodyDOM.prepend(macTitleBar)
  appContainerDom = document.getElementById('appContainer')
  appContainerDom.style.border = 'none'
}


setTimeout(function() {
    document.getElementById('editor').focus();
}, 0);

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

/* Displays file name on titlebar when saving */
ipcRenderer.on('fileSaved:name', (e, data) => {
  const titleText = data + ' - CleanText'
  if(process.platform === 'darwin'){
    document.getElementById('macTitleBar').innerText = titleText
  }
  titleBar.updateTitle(titleText)
});

/* Formats the text upon receiving a command */
ipcRenderer.on('formatCommand', (e, command) => {
    document.execCommand('removeFormat')
    document.execCommand(command);
});

/* Formats the text upon receiving a command with arguments */
ipcRenderer.on('formatCommandWithArgs', (e, data) => {
  document.execCommand('removeFormat')
  document.execCommand(data.command, false, data.arguments);
});

executeCommand = (command, arg) => {
  document.execCommand('removeFormat')
  if(command == 'removeFormat'){
    document.execCommand('formatBlock', false, 'div')
  }
  if(!arg){
    document.execCommand(command)
  }
  else{
    document.execCommand(command, false, arg)
  }
}

/* https://gist.github.com/dantaex/543e721be845c18d2f92652c0ebe06aa */

saveSelection= () =>  {
  if (window.getSelection) {
      var sel = window.getSelection();
      if (sel.getRangeAt && sel.rangeCount) {
          return sel.getRangeAt(0);
      }
  } else if (document.selection && document.selection.createRange) {
      return document.selection.createRange();
  }
  return null;
}

restoreSelection = (range) => {
  if (range) {
      if (window.getSelection) {
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
      } else if (document.selection && range.select) {
          range.select();
      }
  }
}

/* https://gist.github.com/dantaex/543e721be845c18d2f92652c0ebe06aa */

/* Saves Selection for Inserting Items from Modals */
saveSel = () =>{
  selectionRange = saveSelection();
}

/* Inserts an Image into the document */
insertImage = (url) => {
  restoreSelection(selectionRange);
  imageSource = url
  if(imageSource != '' && imageSource != 'null'){
    document.execCommand('insertImage', false, imageSource)
  }
}


/*Format Dropdown*/
$('.formatSelectTrigger').dropdown({
  inDuration: 300,
  outDuration: 225,
  alignment: 'left', // Displays dropdown with edge aligned to the left of button
  constrainWidth: false,
  coverTrigger: false,
  onCloseEnd: () => {
    var editor = document.getElementById('editor');
    setTimeout(function() {
      editor.focus();
    }, 0);
  }
}
);


/* Image Insert Modal */
$(document).ready(function(){
  $('.modal').modal();
});

/* Image Drag Drop */

onDragEnter = function(event) {
  event.preventDefault();
  $("#imageDrop").addClass("dragover");
}, 

onDragOver = function(event) {
  event.preventDefault(); 
  if(!$("#imageDrop").hasClass("dragover"))
      $("#imageDrop").addClass("dragover");
}, 

onDragLeave = function(event) {
  event.preventDefault();
  $("#imageDrop").removeClass("dragover");
},

onDrop = function(event) {
  event.preventDefault();
  $("#imageDrop").removeClass("dragover");
  fileList = event.originalEvent.dataTransfer.files
  if(fileList[0] != undefined){
    insertImage(fileList[0]['path'])
    $('.modal').modal('close')
  }else{
    $("#imageDrop").text('Please drop a local image file, or use a URL')
  }
};

$("#imageDrop")
.on("dragenter", onDragEnter)
.on("dragover", onDragOver)
.on("dragleave", onDragLeave)
.on("drop", onDrop);

insertImageURL = () => {
  insertImage(document.getElementById("image_url_input").value)
}

/* UI Autohide */
let uiAutoHideTimer = null;
$( "#editor" ).keypress(function() {
  uiAutoHideTimer = setTimeout(() => {
    if(uiAutoHideTimer != null){
        $("#controlPanel").stop().fadeTo(10, 0);
      if(process.platform == 'win32'){
        $(".menubar").stop().fadeTo(10, 0);
      }
    }
  }, 5000)
});
$("#appContainer").mousemove(function() {
    uiAutoHideTimer = null
    $("#controlPanel").stop().fadeTo(10, 1);
    if(process.platform == 'win32'){
      $(".menubar").stop().fadeTo(10, 1);
    }
})
