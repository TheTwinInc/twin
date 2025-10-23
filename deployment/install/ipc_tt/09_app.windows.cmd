nssm remove XDROP.server
nssm install XDROP.server "C:\Program Files\nodejs\node.exe"
nssm set XDROP.server AppDirectory c:\uriberg\projects\kis\fastdrop\src\server\xdrop\src
nssm set XDROP.server AppParameters server.js
@REM nssm set XDROP.server DependOnService postgresql-x64-11
nssm set XDROP.server Start SERVICE_AUTO_START
nssm start XDROP.server