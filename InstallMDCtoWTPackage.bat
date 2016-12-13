@ECHO off
SET CURRENT_FOLDER=%~dp0
SET DTEXEC_EXE="C:\Program Files\Microsoft SQL Server\100\DTS\Binn\dtexec.exe"
IF EXIST %DTEXEC_EXE% (
ECHO load MDC alert data
%DTEXEC_EXE% /f "%CURRENT_FOLDER%Packages\MDCtoWTIntegration.dtsx" /Conf "%CURRENT_FOLDER%Config\SSISJob.dtsConfig"
ECHO load MDC alert data done, press any key to exist
) ELSE (
ECHO Error:Can't find the dtexec.exe tool, please set the correct path mannually in this flie
)
PAUSE
