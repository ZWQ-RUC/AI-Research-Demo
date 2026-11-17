@echo off
rem ============================================================
rem  Quick demo launcher for the 3D creative works.
rem  Double-click this file to open both project pages in the
rem  default browser.
rem
rem  IMPORTANT - keep this file pure ASCII / English only.
rem  The project folders have Chinese names; typing them here
rem  breaks after git line-ending conversion, editor re-saving
rem  or code page changes (e.g. 65001). So the paths are NOT
rem  hard-coded: they are located at run time by their ASCII
rem  file names, which works in any extracted folder.
rem ============================================================
setlocal
cd /d "%~dp0"
title 3D Creative Works - Quick Demo

set "FILE1="
set "FILE2="

rem 1) Wonderland project: the single-file page, unique ASCII name
for /r "%~dp0" %%f in (yaolin_wonderland_singlefile.html) do if exist "%%f" if not defined FILE1 set "FILE1=%%f"

rem 2) City project: the index.html that sits next to package.json
for /r "%~dp0" %%f in (index.html) do if exist "%%f" if exist "%%~dpfpackage.json" set "FILE2=%%f"

echo ============================================================
echo    3D Creative Works - Quick Demo
echo ============================================================
echo.

echo [1/2] Opening the wonderland cave project...
if defined FILE1 echo         %FILE1%
if not defined FILE1 echo         [ERROR] yaolin_wonderland_singlefile.html not found.
if defined FILE1 start "" "%FILE1%"
echo.

echo [2/2] Opening the Chongqing 8D city generator...
if defined FILE2 echo         %FILE2%
if not defined FILE2 echo         [ERROR] index.html (next to package.json) not found.
if defined FILE2 start "" "%FILE2%"
echo.

set "OK=1"
if not defined FILE1 set "OK="
if not defined FILE2 set "OK="
if defined OK echo Done! Both pages were sent to your default browser.
if defined OK echo This window will close automatically.
if not defined OK echo Something was not found. Please put this .bat file in the
if not defined OK echo same folder as the two project folders and run it again.
if not defined OK pause
if defined OK ping -n 4 127.0.0.1 >nul
exit /b
