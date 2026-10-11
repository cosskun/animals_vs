@echo off
title AniClash: Beast Rumble - Mobil Onizleme Simulatoru
echo AniClash: Beast Rumble mobil pencere modunda baslatiliyor...

set "HTML_PATH=%~dp0index.html"

:: Edge veya Chrome'u ozel telefon boyutlarinda bagimsiz pencere (App Mode) olarak calistir
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app="file:///%HTML_PATH:\=/%" --window-size=450,920 --window-position=500,60
    exit
)

if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files\Microsoft\Edge\Application\msedge.exe" --app="file:///%HTML_PATH:\=/%" --window-size=450,920 --window-position=500,60
    exit
)

if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app="file:///%HTML_PATH:\=/%" --window-size=450,920 --window-position=500,60
    exit
)

if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --app="file:///%HTML_PATH:\=/%" --window-size=450,920 --window-position=500,60
    exit
)

:: Tarayici bulunamazsa varsayilan tarayiciyla ac
start "" "%HTML_PATH%"
exit
