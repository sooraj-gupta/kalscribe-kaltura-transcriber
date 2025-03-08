const art = require('ascii-art');
const colors = require('colors');
// var Color = require('ascii-art-ansi/colors');
// Color.is256 = true;

const Image = require('ascii-art-image');

const express = require('express');
const app = express();
const port = 3333;

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

const { spawn } = require('child_process');

// ASCII art for the server start header

let image = new Image({
  filepath: 'kaltura.png',
  alphabet: 'blocks',
  width: 20,
  height: 20
});
image.write(function(err, rendered){
  console.log(rendered);
  art.font("KalScribe", 'rusted', function(err, rendered){
    if (err) {
      console.log('Something went wrong'.red);
      return;
    }
    console.log(rendered.cyan); // Displaying the rendered text in cyan
    console.log("© Sooraj Gupta 2024\n\n\n".gray);
    
    app.listen(port).on('listening', () => {
      console.log(`Server started on http://localhost:${port}\n`.green);
      console.log('Make requests to http://localhost:3333/url?url=your_kaltura_video_url\n\n'.yellow);
    });

  });
});

app.get('/url', (req, res) => {
  let url = req.query.url;
  console.log('Received request for: '.blue + url.yellow);
  res.send('Processing your request...'.green);

  readline.question('Enter the folder name to save files: '.cyan, folderName => {
    console.log('Folder name is: '.green + folderName.yellow);
    console.log(`Running kalturatranscriber.cjs with URL: ${url} and folder name: ${folderName}`.magenta);
    runKalturaTranscriber(url, folderName);
  });
});

async function runKalturaTranscriber(url, folderName) {
  const child = spawn('node', ['kalturatranscriber.cjs', url, folderName]);
  child.stdout.on('data', (data) => {
      process.stdout.write(data.toString());
  });
  child.on('close', (code) => {
    console.log(`kalturatranscriber.js exited with code ${code}`.yellow);
  });
}
