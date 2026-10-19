@echo off

xcopy "%~dp0*" "\\nas\APP_DATA_PRD\INCENDIS\temp\poblacio\" /Y /I
xcopy "%~dp0*data\" "\\nas\APP_DATA_PRD\INCENDIS\temp\poblacio\data\" /Y /I
xcopy "%~dp0*assets\css\" "\\nas\APP_DATA_PRD\INCENDIS\temp\poblacio\assets\css\" /Y /I
xcopy "%~dp0*assets\js\" "\\nas\APP_DATA_PRD\INCENDIS\temp\poblacio\assets\js\" /Y /I
xcopy "%~dp0*assets\vendor\" "\\nas\APP_DATA_PRD\INCENDIS\temp\poblacio\assets\vendor\" /Y /I
pause