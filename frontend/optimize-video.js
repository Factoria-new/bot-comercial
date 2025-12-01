import ffmpeg from 'ffmpeg-static';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const videoDir = path.join(__dirname, 'public', 'videos-scroll');
const inputFile = path.join(videoDir, 'NAVIGATE_4K_S10-scrolly@md.mp4');
const outputFile = path.join(videoDir, 'output_scrub.mp4');

console.log(`Optimizing video: ${inputFile}`);
console.log(`Using ffmpeg at: ${ffmpeg}`);

const command = `"${ffmpeg}" -i "${inputFile}" -c:v libx264 -x264-params keyint=1:min-keyint=1:scenecut=0 -crf 20 -preset medium -c:a copy "${outputFile}"`;

exec(command, (error, stdout, stderr) => {
    if (error) {
        console.error(`Error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`FFmpeg output: ${stderr}`);
    }
    console.log('Optimization complete!');

    // Rename/Replace
    try {
        // Backup original
        // fs.renameSync(inputFile, inputFile + '.bak');
        // Replace with new
        // fs.renameSync(outputFile, inputFile);
        console.log('Video optimized successfully. Please verify "output_scrub.mp4" in the folder and rename it manually if satisfied, or uncomment the rename logic in this script.');
    } catch (err) {
        console.error('Error renaming files:', err);
    }
});
