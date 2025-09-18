# Network Access Control with User Groups

This guide outlines a strategy for controlling network access for VPN users based on their group membership. By leveraging the group management features in the Radius Admin dashboard, you can restrict users to access only specific servers on your network.

## Scenario

We have an OpenConnect VPN server and three file servers with the following IP addresses:
- `192.168.20.130` (FileServer1)
- `192.168.20.135` (FileServer2)
- `192.168.20.137` (FileServer3)

The goal is to ensure that employees can only access the file servers they are explicitly granted permission to, through the VPN.

## Strategy: Group-Based Routing with FreeRADIUS

The solution is to use FreeRADIUS groups to push specific network routes to the OpenConnect VPN server (ocserv) when a user authenticates. We will use the `Framed-Route` RADIUS attribute to define which IP addresses a user is allowed to access.

When a user connects, `ocserv` will receive the routes associated with the user's group and will add them to the user's session, effectively limiting their network access to those routes.

For this to be fully restrictive, you should configure `ocserv` to drop any traffic from the user that does not match the routes provided by RADIUS. You can do this by setting `restrict-user-to-routes = true` in your main `ocserv.conf` file.

## Implementation Steps

Here are the step-by-step instructions to implement this strategy using the Radius Admin dashboard.

### 1. Create a Group for Each File Server

First, we need to create a group for each file server that we want to control access to.

1.  Navigate to the **Groups Management** section in the Radius Admin dashboard.
2.  Click on **Add Group**.
3.  Create a group for the first file server. For example, `fileserver1-access`.
4.  Under **Reply Attributes**, add the following:
    *   **Attribute:** `Framed-Route`
    *   **op:** `:=`
    *   **Value:** `192.168.20.130/32`

    The `/32` subnet mask ensures that access is restricted to this single IP address.

5.  Click **Create Group**.

Repeat this process for the other file servers, creating groups like `fileserver2-access` and `fileserver3-access` with their corresponding IP addresses in the `Framed-Route` value (`192.168.20.135/32` and `192.168.20.137/32`).

### 2. (Optional) Create a Group for Access to Multiple Servers

If you have users who need access to more than one file server, you can create a group that provides multiple routes.

1.  Create a new group, for example, `fileservers-1-and-3-access`.
2.  Add a `Framed-Route` reply attribute for each server the user should have access to. For example:
    *   **Attribute 1:** `Framed-Route` := `192.168.20.130/32`
    *   **Attribute 2:** `Framed-Route` := `192.168.20.137/32`

A user assigned to this group will be able to access both `FileServer1` and `FileServer3`.

### 3. Assign Users to Groups

Now that the groups are set up, you can assign users to them.

1.  Go to the **User Management** section.
2.  Select the user you want to configure.
3.  Assign them to the appropriate group (e.g., `fileserver1-access`).

A user can be a member of multiple groups if needed. FreeRADIUS will aggregate the attributes from all the groups a user belongs to.

### 4. Verify the Setup

1.  Ensure the user is assigned to the correct group.
2.  Have the user connect to the VPN.
3.  Ask the user to try and access the file server they are supposed to have access to (e.g., `\\192.168.20.130`). This should be successful.
4.  Ask the user to try and access a file server they are *not* supposed to have access to (e.g., `\\192.168.20.135`). This connection should fail.

By following these steps, you can effectively manage fine-grained network access for your VPN users directly from the Radius Admin dashboard.

## A Note on Traffic Tunneling and Security

A common question regarding this setup is whether using `Framed-Route` prevents user data from being tunneled through the VPN. 

The answer is that all traffic between the user and the specified file server IP addresses **is fully tunneled and encrypted** through the VPN. The `Framed-Route` attribute is precisely what instructs the VPN client to direct this specific traffic into the tunnel.

The `restrict-user-to-routes = true` setting in `ocserv.conf` is the critical component for security. It acts as a server-side firewall, ensuring that once the user's traffic enters the VPN server, it is only allowed to proceed to the destinations explicitly defined in the `Framed-Route` attributes. Any attempt by the user to access other internal network resources will be blocked by the VPN server itself. This creates a secure, isolated channel for each user, granting them access only to their designated servers.

## Testing Your Setup with a Simulated File Server

Before deploying this in a production environment, you can test your entire configuration by simulating a file server directly on your Ubuntu VPN server. This allows you to verify that the routing and access restrictions are working as expected.

This guide uses standard Linux kernel modules and IP tools, which is a more reliable method than `netplan` for this purpose.

### 1. Create a Virtual Network Interface

First, we will create a temporary "dummy" network interface for the current session.

1.  **Load the kernel module and create the interface:**
    ```bash
    sudo modprobe dummy
    sudo ip link add dummy0 type dummy
    sudo ip link set dummy0 up
    ```

2.  **Assign the IP addresses of your file servers:**
    ```bash
    sudo ip addr add 192.168.20.130/32 dev dummy0
    sudo ip addr add 192.168.20.135/32 dev dummy0
    sudo ip addr add 192.168.20.137/32 dev dummy0
    ```

3.  **Verify that the interface is active:**
    ```bash
    ip addr show dummy0
    ```
    You should see the `dummy0` interface with the assigned IP addresses.

### 2. Make the Virtual Interface Persistent (Optional)

To ensure the dummy interface is recreated automatically after a reboot, you can create a simple `systemd` service.

1.  **Create a setup script:**
    ```bash
    sudo nano /usr/local/bin/setup_dummy_net.sh
    ```
    Paste the following content into the file. The `|| true` parts prevent errors if the commands are run more than once.
    ```bash
    #!/bin/bash
    set -e
    modprobe dummy
    ip link add dummy0 type dummy || true
    ip link set dummy0 up
    ip addr add 192.168.20.130/32 dev dummy0 || true
    ip addr add 192.168.20.135/32 dev dummy0 || true
    ip addr add 192.168.20.137/32 dev dummy0 || true
    ```
    Save the file and make it executable:
    ```bash
    sudo chmod +x /usr/local/bin/setup_dummy_net.sh
    ```

2.  **Create the `systemd` service file:**
    ```bash
    sudo nano /etc/systemd/system/setup-dummy-net.service
    ```
    Paste the following service definition:
    ```ini
    [Unit]
    Description=Setup Dummy Network Interface for VPN Testing
    After=network.target

    [Service]
    Type=oneshot
    ExecStart=/usr/local/bin/setup_dummy_net.sh
    RemainAfterExit=yes

    [Install]
    WantedBy=multi-user.target
    ```

3.  **Enable the service** to start on boot:
    ```bash
    sudo systemctl enable setup-dummy-net.service
    ```

### 3. Set Up a Samba File Share for Testing

-----

### \#\# 2. Install Samba 📦

Install the Samba package and its related dependencies using a single command. The `-y` flag automatically confirms the installation.

```bash
sudo apt install samba -y
```

After the installation is complete, you can verify that the Samba service (`smbd`) is active and running.

```bash
sudo systemctl status smbd
```

You should see an `active (running)` status in green. Press `q` to exit the status view.

-----

### \#\# 3. Configure the Samba Shares ⚙️

This is the most important step. You'll edit the main Samba configuration file, `/etc/samba/smb.conf`.

#### **Backup the Original Configuration**

Before making any changes, create a backup of the original file. This is a crucial safety step.

```bash
sudo cp /etc/samba/smb.conf /etc/samba/smb.conf.bak
```

#### **Edit the Configuration File**

Now, open the configuration file with a text editor like `nano`.

```bash
sudo nano /etc/samba/smb.conf
```

Scroll to the very bottom of the file and add the following blocks to define your shares.

**Example 1: Public Guest Share**
This share will be accessible to anyone on the network without a password. Files will be readable and writable by all.

```ini
[Public]
  path = /srv/samba/public
  writable = yes
  guest ok = yes
  guest only = yes
  force create mode = 0666
  force directory mode = 0777
  comment = Public guest share
```

**Example 2: Secure Private Share**
This share will only be accessible to a specific, authenticated user. The `%u` variable is a placeholder that automatically inserts the username of the person connecting.

```ini
[Private]
  path = /srv/samba/private/%u
  writable = yes
  valid users = %u
  read only = no
  comment = Secure private share for %u
```

After adding these blocks, save the file and exit `nano` by pressing `Ctrl + X`, followed by `Y`, and then `Enter`.

-----

### \#\# 1. Specify Network Interfaces in `smb.conf`


1.  **Find your network interface name.** Run the following command:

    ```bash
    ip a
    ```

    Look for your main network interface. It will likely be named something like **`eth0`**, **`Dummy0`**, or **`enp0s3`** and will have your server's IP address.

2.  **Edit the Samba configuration file.**

    ```bash
    sudo nano /etc/samba/smb.conf
    ```

3.  **Add the following lines** under the `[global]` section. Replace `eth0` with your actual interface name from step 1. Including `lo` (the loopback interface) is good practice.

    ```ini
    interfaces = lo dummy0
    bind interfaces only = yes
    ```

4.  Save the file (`Ctrl + X`, then `Y`, then `Enter`).

-----

### \#\# 2. Restart the Service

After making the configuration change, restart `nmbd` and check its status.

```bash
sudo systemctl restart nmbd.service
sudo systemctl restart smbd.service
```

-----

### \#\# 4. Create Directories and Set Permissions 📁

The paths you defined in the configuration file (`/srv/samba/...`) don't exist yet. You need to create them and set the correct permissions.

#### **For the Public Share**

```bash
# Create the directory
sudo mkdir -p /srv/samba/public

# Set permissions to allow read/write access for everyone
sudo chmod -R 777 /srv/samba/public
```

#### **For the Private Share Structure**

We'll create a parent directory and a group for Samba users to keep things organized and secure.

```bash
# Create a group for samba users
sudo addgroup smbgroup

# Create the parent directory for private shares
sudo mkdir -p /srv/samba/private

# Set ownership to the root user and the smbgroup
sudo chown -R root:smbgroup /srv/samba/private

# Set permissions so only users in smbgroup can access it
sudo chmod -R 770 /srv/samba/private
```

-----

### \#\# 5. Create a Samba User 👤

Samba uses its own password system, which is separate from the system's Linux user passwords. You must add an existing Linux user to the Samba password database.

Let's assume you want to create a private share for a Linux user named `dev`.

1.  **Add the user to the `smbgroup`** you created earlier.

    ```bash
    sudo usermod -aG smbgroup dev
    ```

2.  **Set a Samba password for that user.** You will be prompted to enter and confirm a new password. This does **not** have to be the same as their Linux login password.

    ```bash
    sudo smbpasswd -a dev
    ```

3.  **Create the user's private directory.** When the user `dev` connects, Samba will look for `/srv/samba/private/dev`. You need to create and configure this directory for them.

    ```bash
    # Create the user's specific folder
    sudo mkdir /srv/samba/private/dev

    # Set the user as the owner of their folder
    sudo chown dev:smbgroup /srv/samba/private/dev
    ```

    Repeat this step for every user who needs a private share.

-----

### \#\# 6. Restart Samba and Configure Firewall 🛡️

For your changes to take effect, restart the Samba services.

```bash
sudo systemctl restart smbd nmbd
```

Finally, you need to allow Samba traffic through Ubuntu's Uncomplicated Firewall (UFW).

```bash
sudo ufw allow 'Samba'
sudo ufw delete allow from 192.168.20.130 to any port 445 proto tcp
sudo ufw reload
```

You can check the firewall status to confirm the rule was added.

```bash
sudo ufw status
```

-----

### \#\# 7. Connect to Your Share 🤝

Your Samba server is now ready\! You can connect to it from any client machine on the same network.

  * **From Windows:** Open File Explorer and type `\\server_ip_address` in the address bar. You should see the `Public` and `Private` shares.
  * **From macOS:** Open Finder, click `Go` \> `Connect to Server`, and enter `smb://server_ip_address`.
  * **From Linux:** Open your file manager and connect to `smb://server_ip_address`.

When you try to access the `Private` share, you will be prompted for the username (`dev`) and the Samba password you set with the `smbpasswd` command.

You are now ready to test the end-to-end configuration.

Yes, it's absolutely possible to have Samba use more than one network interface and then restrict a specific shared folder to be available only on one of those interfaces.

You achieve this by combining a **global setting** to listen on all desired interfaces with a **per-share setting** to filter access based on the client's IP address.

-----

### \#\# 1. Configure Samba to Use Multiple Interfaces 🌐

First, you need to tell Samba to listen for connections on all the network interfaces you want it to use. This is done in the `[global]` section of your `/etc/samba/smb.conf` file.

Let's say your server has two interfaces:

  * `eth0` with an IP on the `192.168.1.0/24` network.
  * `eth1` with an IP on the `10.0.0.0/24` network.

You would edit your `smb.conf` like this:

```bash
sudo nano /etc/samba/smb.conf
```

In the `[global]` section, add or modify the `interfaces` line to include the names of your interfaces or their subnets. The `bind interfaces only = yes` directive is a crucial security measure to ensure Samba only listens on these specific interfaces.

```ini
[global]
   ## Add these lines under your existing global settings
   interfaces = lo eth0 eth1
   bind interfaces only = yes
```

This configuration makes the Samba server accessible from both the `192.168.1.0/24` and `10.0.0.0/24` networks.

-----
### \#\# 2. Restrict a Share to a Specific Interface 🔒

While there isn't a direct `interface = eth1` setting for a share, you can achieve the same result by using the **`hosts allow`** parameter. This parameter filters access based on the source IP address of the client, effectively tying the share to the network connected to a specific interface.

Continuing the example, let's create two shares:

  * `[Public]` will be available to everyone on both networks.
  * `[Admin]` will be available **only** to clients on the `10.0.0.0/24` network (connected via `eth1`).

Append this to the end of your `smb.conf` file:

```ini
[Public]
  path = /srv/samba/public
  writable = yes
  guest ok = yes
  comment = Available on all networks

[Admin]
  path = /srv/samba/admin
  writable = yes
  valid users = @your_admin_group
  comment = Available only on the 10.0.0.0 network
  # This is the key line for restricting access:
  hosts allow = 10.0.0.0/24 127.0.0.1
```

**How it works:**

  * The `[Public]` share has no `hosts allow` line, so it follows the global rule and is accessible from any interface Samba is listening on.
  * The `[Admin]` share's **`hosts allow = 10.0.0.0/24 127.0.0.1`** line acts as a filter. Samba will only grant access to this share if the connection request comes from an IP address within the `10.0.0.0/24` subnet or from the server itself (`127.0.0.1`).

-----

### \#\# 3. Apply the Changes

After saving your `smb.conf` file, always check it for syntax errors with `testparm`.

```bash
testparm
```

If it shows no errors, restart the Samba services to apply your new configuration.

```bash
sudo systemctl restart smbd nmbd
```

Now, clients from the `192.168.1.0/24` network will be able to see and access the `[Public]` share but will be denied access to the `[Admin]` share, while clients on the `10.0.0.0/24` network can access both.

1.  **Configure RADIUS:** In the Radius Admin dashboard, create a test group that has a `Framed-Route` reply attribute for `192.168.20.130/32`. Assign your test user to this group.
2.  **Connect to VPN:** On your Windows machine, connect to the VPN with your test user.
3.  **Test Access:** Open File Explorer and navigate to `\\192.168.20.130\testshare`. The connection should succeed, and you should see the shared folder.
4.  **Test Restriction:** Now, try to access `\\192.168.20.135\testshare`. If `restrict-user-to-routes` is enabled on your VPN server, this connection should fail. This confirms your access control rules are working correctly.
