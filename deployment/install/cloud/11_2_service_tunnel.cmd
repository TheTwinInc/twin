nssm install XDROP.ServiceTunnel "C:\Program Files\OpenSSH-Win64\ssh.exe"
nssm set XDROP.ServiceTunnel AppDirectory "C:\Program Files\OpenSSH-Win64"
nssm set XDROP.ServiceTunnel AppParameters xdrop
nssm set XDROP.ServiceTunnel Start SERVICE_AUTO_START
nssm set XDROP.ServiceTunnel ObjectName .\<user> <password>
nssm start XDROP.ServiceTunnel