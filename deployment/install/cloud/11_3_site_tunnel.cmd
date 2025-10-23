nssm install XDROP.SiteTunnel "C:\Program Files\OpenSSH-Win64\ssh.exe"
nssm set XDROP.SiteTunnel AppDirectory "C:\Program Files\OpenSSH-Win64"
nssm set XDROP.SiteTunnel AppParameters xdrop
nssm set XDROP.SiteTunnel Start SERVICE_AUTO_START
nssm start XDROP.SiteTunnel