sudo apt update
sudo apt install mosquitto mosquitto-clients -y

sudo mosquitto_passwd -c /etc/mosquitto/passwd xdrop

sudo nano /etc/mosquitto/conf.d/default.conf



# Copy
allow_anonymous false
password_file /etc/mosquitto/passwd
# Windows. Ensure System access
password_file c:\sac\bin\mosquitto\passwd

#unsecure connection, accept connections only from localhost
listener 1883 127.0.0.1
#secure websockets
listener 8081 127.0.0.1
protocol websockets

sudo systemctl restart mosquitto

mosquitto_sub -h localhost -t test -u test -P test
mosquitto_pub -h localhost -t 'test' -m "hello world" -u test -P test

# Listen ports
    # 1883 : MQTT, unencrypted.
    # 8883 : MQTT, encrypted.
    # 8884 : MQTT, encrypted, client certificate required.
    # 8080 : MQTT over WebSockets, unencrypted.
    # 8081 : MQTT over WebSockets, encrypted.
