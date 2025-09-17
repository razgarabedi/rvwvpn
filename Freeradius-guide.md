I understand. You need the complete guide in a single `.md` formatted block suitable for a `README.md` file, without any extra conversation or framing text. Here is the entire guide, written and formatted specifically for that purpose.

-----

### How to Install OpenConnect (ocserv) with FreeRADIUS and PostgreSQL

This guide provides a step-by-step process for setting up a VPN server using **ocserv** that authenticates and accounts for user sessions via **FreeRADIUS**, with all data stored in a **PostgreSQL** database on an **Ubuntu 22.04** server.

-----

### 1\. Install and Configure PostgreSQL

First, install PostgreSQL, create a database for FreeRADIUS, and set up a user with the necessary permissions.

1.  **Install PostgreSQL:**

    ```bash
    sudo apt update
    sudo apt install postgresql postgresql-contrib -y
    ```

2.  **Create the FreeRADIUS database and user:**

    ```bash
    sudo -u postgres psql -c "CREATE DATABASE radius;"
    sudo -u postgres psql -c "CREATE USER radius WITH ENCRYPTED PASSWORD 'your_secure_password';"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE radius TO radius;"
    ```

    ⚠️ **Important:** Replace `your_secure_password` with a strong, unique password.

-----

### 2\. Install and Configure FreeRADIUS

Next, install FreeRADIUS and its PostgreSQL module, then configure it to use the database you just created.

1.  **Install FreeRADIUS and PostgreSQL module:**

    ```bash
    sudo apt install freeradius freeradius-postgresql -y
    ```

2.  **Import the PostgreSQL schema:**
    The `postgres` user needs permission to read the schema file.

    ```bash
    sudo chmod o+r /etc/freeradius/3.0/mods-config/sql/main/postgresql/schema.sql
    sudo -u postgres psql -d radius -f /etc/freeradius/3.0/mods-config/sql/main/postgresql/schema.sql
    sudo chmod o-r /etc/freeradius/3.0/mods-config/sql/main/postgresql/schema.sql
    ```

3.  **Configure the SQL module:**
    Open `/etc/freeradius/3.0/mods-available/sql` and edit the following lines to match your PostgreSQL setup:

    ```
    driver = "rlm_sql_postgresql"
    dialect = "postgresql"
    server = "localhost"
    login = "radius"
    password = "your_secure_password"
    radius_db = "radius"
    ```

4.  **Enable the SQL module:**

    ```bash
    sudo ln -s /etc/freeradius/3.0/mods-available/sql /etc/freeradius/3.0/mods-enabled/sql
    ```

5.  **Configure the `default` virtual server:**
    Open `/etc/freeradius/3.0/sites-available/default` and make these changes:

      - In the `authorize` section, **comment out `files`** and **uncomment `sql`**.
      - In the `accounting` section, **uncomment `sql`**.

6.  **Add a RADIUS client (ocserv):**
    Open `/etc/freeradius/3.0/clients.conf` and add the following block:

    ```
    client ocserv {
        ipaddr = 127.0.0.1
        secret = "your_radius_secret"
    }
    ```

    ⚠️ **Important:** If you encounter a "duplicate client" error, check for existing definitions in the `clients.d/` directory and remove them, or simply rename your client to something unique like `my-ocserv`.

7.  **Restart FreeRADIUS and add a test user:**

    ```bash
    sudo systemctl restart freeradius
    sudo systemctl enable freeradius

    sudo -u postgres psql -d radius -c "INSERT INTO radcheck (UserName, Attribute, op, Value) VALUES ('testuser', 'Cleartext-Password', ':=', 'testpassword');"
    ```

-----

### 3\. Install and Configure OpenConnect (ocserv)

Now, install **ocserv** and configure it to use the FreeRADIUS server for both authentication and accounting.

1.  **Install ocserv:**

    ```bash
    sudo apt install ocserv -y
    ```

2.  **Generate SSL certificates:**

    ```bash
    sudo apt install gnutls-bin -y
    sudo mkdir -p /etc/ocserv/certs
    cd /etc/ocserv/certs

    certtool --generate-privkey --outfile ca-key.pem
    certtool --generate-self-signed --load-privkey ca-key.pem --outfile ca-cert.pem --template <(echo -e 'cn = "Your_Org_CA"\norganization = "Your_Organization"\nserial = 1\nexpiration_days = 3650\nca\nsigning_key\ncert_signing_key\ncrl_signing_key')

    certtool --generate-privkey --outfile server-key.pem
    certtool --generate-certificate --load-privkey server-key.pem --load-ca-certificate ca-cert.pem --load-ca-privkey ca-key.pem --outfile server-cert.pem --template <(echo -e 'cn = "your_server_hostname"\norganization = "Your_Organization"\nexpiration_days = 3650\nsigning_key\nencryption_key\ntls_www_server')
    ```

    ⚠️ **Important:** Replace `your_server_hostname` with your server's public IP or domain name.

3.  **Configure ocserv:**
    Open `/etc/ocserv/ocserv.conf` and update the following sections:

    ```
    # Authentication & Accounting
    #auth = "plain[passwd=/etc/ocserv/ocpasswd]"
    auth = "radius[config=/etc/radcli/radiusclient.conf]"
    acct = "radius[config=/etc/radcli/radiusclient.conf]"

    # Certificates
    server-cert = /etc/ocserv/certs/server-cert.pem
    server-key = /etc/ocserv/certs/server-key.pem

    # VPN Network
    ipv4-network = 192.168.200.0
    ipv4-netmask = 255.255.255.0
    dns = 8.8.8.8
    dns = 1.1.1.1
    route = default
    ```

4.  **Configure the ocserv RADIUS client:**
    Open `/etc/radcli/radiusclient.conf` and set the server details and shared secret.

    ```
    authserver 127.0.0.1
    acctserver 127.0.0.1
    servers /etc/radcli/servers
    secret your_radius_secret
    ```

    ⚠️ **Important:** The `secret` must be identical to the one in `clients.conf`.

5.  **Enable IP forwarding and NAT:**

    ```bash
    sudo nano /etc/sysctl.conf
    # Uncomment the line:
    net.ipv4.ip_forward=1

    sudo sysctl -p

    # Set up NAT
    sudo iptables -t nat -A POSTROUTING -s 192.168.200.0/24 -o eth0 -j MASQUERADE
    sudo sh -c "iptables-save > /etc/iptables/rules.v4"
    sudo apt install iptables-persistent -y
    ```

    ⚠️ **Note:** Replace `eth0` with your server's public network interface name.

6.  **Restart ocserv:**

    ```bash
    sudo systemctl restart ocserv
    sudo systemctl enable ocserv
    ```

-----

### 4\. Verify the Configuration

1.  **Check service status:**

    ```bash
    sudo systemctl status ocserv
    sudo systemctl status freeradius
    ```

    Both services should be `active (running)`.

2.  **Test the connection:**
    On a client, use `openconnect your_server_public_ip` and authenticate with `testuser` and `testpassword`.

3.  **Verify accounting data:**
    Check the `radacct` table in the PostgreSQL database for session details.

    ```bash
    sudo -u postgres psql -d radius -c "SELECT username, nasipaddress, acctstarttime, acctstoptime, acctinputoctets, acctoutputoctets FROM radacct;"
    ```