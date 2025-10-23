# nano /etc/config/uhttpd
# # Change
#         # HTTP listen addresses, multiple allowed
#         list listen_http        192.168.13.1:8080
#         list listen_http       [::]:8080

#         # HTTPS listen addresses, multiple allowed
#         list listen_https       192.168.13.1:8443
#         list listen_https      [::]:8443

    
# /etc/init.d/uhttpd restart

nano /etc/lighttpd/lighttpd.conf

# Change port to 8000

/etc/init.d/lighttpd enable

mkdir /etc/nginx/conf.d/

nano /etc/nginx/conf.d/luci_uwsgi.conf

nano /etc/nginx/blockips.conf

cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf_original
nano /etc/nginx/nginx.conf

nano /etc/nginx/uwsgi_params

nginx -t
/etc/init.d/nginx restart