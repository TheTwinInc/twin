nssm remove XDROP.loader
nssm install XDROP.loader "C:\Python310\python.exe"
nssm set XDROP.loader AppDirectory "C:\uriberg\projects\kis\fastdrop\src\server\scanner"
nssm set XDROP.loader AppParameters loader.py
nssm set XDROP.loader Start SERVICE_AUTO_START
nssm start XDROP.loader