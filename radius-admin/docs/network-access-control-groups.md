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
