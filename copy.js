const { exec } = require("child_process");

var os = require('os');
//control OS
//then run command depengin on the OS
function resp(error, stdout, stderr){
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
};

if (os.type() === 'Linux') 
   exec("cp ffmpeg.exe ./dist && cp mplayer.exe ./dist && cp ./src/alice.crt ./dist && cp ./src/alice.key ./dist", resp); 
else if (os.type() === 'Windows_NT') 
   exec("copy ffmpeg.exe dist && copy mplayer.exe dist && copy src\\alice.crt dist && copy src\\alice.key dist", resp);
else
   throw new Error("Unsupported OS found: " + os.type());