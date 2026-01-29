@echo off
echo ========================================
echo  Mobile Video Optimization
echo ========================================
echo.
echo Input: NAVIGATE_4K_9x16_S40-scrolly@sm.mp4
echo Output: NAVIGATE_4K_9x16_S40-scrolly@sm_OPTIMIZED.mp4
echo.
echo Converting... (This ensures the video can be scrubbed smoothly on mobile)
echo.

ffmpeg -y -i "NAVIGATE_4K_9x16_S40-scrolly@sm.mp4" -c:v libx264 -x264-params keyint=1:min-keyint=1:scenecut=0 -crf 20 -preset medium -c:a copy "NAVIGATE_4K_9x16_S40-scrolly@sm_OPTIMIZED.mp4"

if %errorlevel% equ 0 (
    echo.
    echo SUCCESS! Optimized file created.
    echo.
) else (
    echo.
    echo ERROR: Conversion failed.
    echo.
)
pause
