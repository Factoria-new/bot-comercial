@echo off
echo ========================================
echo  Video Optimization for Smooth Scrolling
echo ========================================
echo.
echo Converting NAVIGATE_4K_S40-scrolly@md.mp4...
echo This may take a few minutes depending on video length.
echo.

ffmpeg -i "NAVIGATE_4K_S40-scrolly@md.mp4" -c:v libx264 -x264-params keyint=1:min-keyint=1:scenecut=0 -crf 20 -preset medium -c:a copy "NAVIGATE_4K_S40-scrolly@md_OPTIMIZED.mp4"

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo  SUCCESS! Video optimized for scrubbing
    echo ========================================
    echo.
    echo Original: NAVIGATE_4K_S40-scrolly@md.mp4
    echo Optimized: NAVIGATE_4K_S40-scrolly@md_OPTIMIZED.mp4
    echo.
    echo The optimized video has:
    echo - Every frame is a keyframe (perfect for scroll)
    echo - High quality (CRF 20)
    echo - Original audio preserved
    echo.
    echo NEXT STEPS:
    echo 1. Test the _OPTIMIZED video in your browser
    echo 2. If smooth, replace the original or update code
    echo.
) else (
    echo.
    echo ========================================
    echo  ERROR: FFmpeg not found or conversion failed
    echo ========================================
    echo.
    echo Please install FFmpeg first:
    echo - Using Chocolatey: choco install ffmpeg
    echo - Or download from: https://ffmpeg.org/download.html
    echo.
)

pause
