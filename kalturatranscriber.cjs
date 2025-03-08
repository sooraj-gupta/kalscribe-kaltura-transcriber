// Use colors for better visual management
if(process.argv.length < 4) {
  console.log("Usage: node kalturatranscriber.cjs <url> <folderName>".red);
  process.exit(1);
}

const url = process.argv[2];
const folderName = process.argv[3];

const readline = require('readline');

let { spawn, execSync: exec } = require('child_process');
const fs = require('fs');
const https = require('https');
const { createClient } = require('@deepgram/sdk');
const ffmpegStatic = require('ffmpeg-static');
const path = require('path');

const colors = require('colors');
const art = require('ascii-art');
const deepgram = createClient('9dc12da963c0c4103175774881a637153dae42e8');

async function runstaticffmpeg(command) {
  return new Promise((resolve, reject) => {
    exec(`${ffmpegStatic} ${command}`, (err, stderr, stdout) => {
      if (err) reject(err)
      resolve(stdout)
    })
  })
}


async function transcribeLocalVideo(folderPath) {
  runstaticffmpeg(`-hide_banner -y -i ${folderPath}/video.mp4 ${folderPath}/audio.wav`); 
  console.log('Audio saved to '.green + `${folderPath}/audio.wav`.yellow);

  console.log('Transcribing...')
  const audioFile = fs.readFileSync(`${folderPath}/audio.wav`)
  const {result, error } = await deepgram.listen.prerecorded.transcribeFile(
    audioFile,
    {
      model: "nova-2",
      punctuate: true,
    }
  )
  return result.results.channels[0].alternatives[0].transcript;
}


console.log("Downloading video from URL: ".green + decodeURIComponent(url).yellow);


// Function to ensure directory exists
function ensureDirectoryExists(folderPath) {
  if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
  }
}
// Use the function before running ffmpeg
let folderPath = path.join('output', folderName);
ensureDirectoryExists(folderPath);

const ffmpeg = spawn('ffmpeg', ['-y','-i', url, '-c', 'copy', '-bsf:a', 'aac_adtstoasc', `output/${folderName}/video.mp4`]);

let totalLength = null;

ffmpeg.stderr.on('data', (data) => {
  data = data.toString();
  // console.log(`stderr: ${data}`);
  if (!totalLength && data.includes("Duration:")) {
    totalLength = data.split("Duration:")[1].split(",")[0].trim();
  }
  if (data.includes("frame=")) {
    data.split(" ").forEach(element => {
      if (element.includes("time=")) {
        readline.cursorTo(process.stdout, 0);
        process.stdout.write("Progress: \x1b[36m" + getVideoViewPercentage(element.split("=")[1], totalLength) + "%" + "\x1b[0m");
      }
    });
  }
});
ffmpeg.on('close', (code) => {
  console.log(`\nVideo downloaded to output/${folderName}/video.mp4`.green);
  // Continue with audio conversion and transcription
  
  console.log("Converting video to audio...".green);
  transcribeLocalVideo(folderPath).then((transcription) => {
    
    //write to transcript.txt
    fs.writeFileSync(`${folderPath}/transcript.txt`, transcription);

    console.log("Transcription saved to ".green + `${folderPath}/transcript.txt\n\n`.yellow);

    console.log("Thank you for using KalScribe!".cyan);
    console.log("© Sooraj Gupta 2024".gray);
  });
});

// Helper functions remain the same

function getVideoViewPercentage(curTime, totalLength) {
  // Helper function to convert a time string "HH:MM:SS.SS" to seconds
  function timeToSeconds(time) {
      const parts = time.split(':');
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      const seconds = parseFloat(parts[2]); // Use parseFloat to handle decimal seconds
      return hours * 3600 + minutes * 60 + seconds;
  }

  // Convert current time and total length to seconds
  const curTimeSeconds = timeToSeconds(curTime);
  const totalLengthSeconds = timeToSeconds(totalLength);

  // Calculate the percentage of the video that has been viewed
  const percentage = (curTimeSeconds / totalLengthSeconds) * 100;

  // Return the percentage rounded to two decimal places
  return percentage.toFixed(2);
}
