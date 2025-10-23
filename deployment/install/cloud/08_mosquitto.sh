sudo apt update
sudo apt install mosquitto mosquitto-clients -y

sudo mosquitto_passwd -c /etc/mosquitto/passwd xdrop

sudo nano /etc/mosquitto/conf.d/default.conf
# Copy
allow_anonymous false
password_file /etc/mosquitto/passwd

sudo systemctl restart mosquitto

# Open one terminal window and listen on the message
mosquitto_sub -h localhost -t test -u xdrop -P xDr0p
# Open another terminal window and send message.
mosquitto_pub -h localhost -t 'test' -m "hello world" -u xdrop -P xDr0p
# Get hello world back.

# Listen ports
    # 1883 : MQTT, unencrypted.
    # 8883 : MQTT, encrypted.
    # 8884 : MQTT, encrypted, client certificate required.
    # 8080 : MQTT over WebSockets, unencrypted.
    # 8081 : MQTT over WebSockets, encrypted.
