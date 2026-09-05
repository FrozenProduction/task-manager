@echo off
REM Default Maven Wrapper script for Windows
REM Generated for task-manager — Spring Boot 3.2.4

setlocal enabledelayedexpansion

set "WRAPPER_DIR=.mvn\wrapper"
set "WRAPPER_PROPERTIES=%WRAPPER_DIR%\maven-wrapper.properties"
set "WRAPPER_JAR=%WRAPPER_DIR%\maven-wrapper.jar"

REM If the wrapper jar doesn't exist, download it
if not exist "%WRAPPER_JAR%" (
    echo Downloading Maven Wrapper...
    for /f "tokens=2 delims==" %%A in ('findstr /c:"wrapperUrl=" "%WRAPPER_PROPERTIES%"') do set "MAVEN_WRAPPER_DOWNLOAD_URL=%%A"
    if not defined MAVEN_WRAPPER_DOWNLOAD_URL (
        echo ERROR: wrapperUrl not found in %WRAPPER_PROPERTIES%
        exit /b 1
    )
    powershell -Command "Invoke-WebRequest -Uri '%MAVEN_WRAPPER_DOWNLOAD_URL%' -OutFile '%WRAPPER_JAR%' -UseBasicParsing"
    if !errorlevel! neq 0 (
        echo ERROR: Failed to download Maven Wrapper. Check network connection.
        exit /b 1
    )
    echo Maven Wrapper downloaded successfully.
)

REM Get Maven version from properties
for /f "tokens=2 delims==" %%A in ('findstr /c:"distributionUrl=" "%WRAPPER_PROPERTIES%"') do set "DISTRIBUTION_URL=%%A"
for /f "tokens=3 delims=-" %%A in ("!DISTRIBUTION_URL!") do set "MAVEN_VERSION=%%A"

REM Execute Maven
echo Running Maven !MAVEN_VERSION!...
java -jar "%WRAPPER_JAR%" %*
