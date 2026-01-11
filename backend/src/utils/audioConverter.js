/**
 * Audio Converter Utility
 * 
 * Converts audio formats for WhatsApp compatibility.
 * WhatsApp requires OGG/Opus format for voice messages.
 */

import { spawn } from 'child_process';
import ffmpegPath from 'ffmpeg-static';

/**
 * Convert WAV buffer to OGG Opus format for WhatsApp voice messages
 * @param {Buffer} wavBuffer - WAV audio buffer
 * @returns {Promise<Buffer>} OGG Opus audio buffer
 */
export async function convertWavToOgg(wavBuffer) {
    return new Promise((resolve, reject) => {
        const chunks = [];

        // Use ffmpeg to convert WAV to OGG Opus
        const ffmpeg = spawn(ffmpegPath, [
            '-i', 'pipe:0',           // Input from stdin
            '-c:a', 'libopus',        // Use Opus codec
            '-b:a', '64k',            // Bitrate
            '-ar', '48000',           // Sample rate (Opus standard)
            '-ac', '1',               // Mono channel
            '-f', 'ogg',              // Output format
            'pipe:1'                  // Output to stdout
        ]);

        ffmpeg.stdout.on('data', (chunk) => {
            chunks.push(chunk);
        });

        ffmpeg.stderr.on('data', (data) => {
            // FFmpeg logs to stderr, ignore unless error
            // console.log(`ffmpeg stderr: ${data}`);
        });

        ffmpeg.on('close', (code) => {
            if (code === 0) {
                resolve(Buffer.concat(chunks));
            } else {
                reject(new Error(`FFmpeg exited with code ${code}`));
            }
        });

        ffmpeg.on('error', (err) => {
            reject(err);
        });

        // Write input and close stdin
        ffmpeg.stdin.write(wavBuffer);
        ffmpeg.stdin.end();
    });
}

/**
 * Convert base64 WAV to base64 OGG
 * @param {string} wavBase64 - WAV audio in base64
 * @returns {Promise<string>} OGG Opus audio in base64
 */
export async function convertWavBase64ToOgg(wavBase64) {
    const wavBuffer = Buffer.from(wavBase64, 'base64');
    const oggBuffer = await convertWavToOgg(wavBuffer);
    return oggBuffer.toString('base64');
}

export default { convertWavToOgg, convertWavBase64ToOgg };
