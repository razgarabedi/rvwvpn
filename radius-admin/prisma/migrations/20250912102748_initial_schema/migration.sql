-- CreateTable
CREATE TABLE "public"."radacct" (
    "RadAcctId" BIGSERIAL NOT NULL,
    "AcctSessionId" TEXT,
    "AcctUniqueId" TEXT NOT NULL,
    "UserName" TEXT,
    "Realm" TEXT,
    "NASIPAddress" TEXT NOT NULL,
    "NASPortId" TEXT,
    "NASPortType" TEXT,
    "AcctStartTime" TIMESTAMP(3),
    "AcctUpdateTime" TIMESTAMP(3),
    "AcctStopTime" TIMESTAMP(3),
    "AcctInterval" BIGINT,
    "AcctSessionTime" BIGINT,
    "AcctAuthentic" TEXT,
    "ConnectInfo_start" TEXT,
    "ConnectInfo_stop" TEXT,
    "AcctInputOctets" BIGINT,
    "AcctOutputOctets" BIGINT,
    "CalledStationId" TEXT,
    "CallingStationId" TEXT,
    "AcctTerminateCause" TEXT,
    "ServiceType" TEXT,
    "FramedProtocol" TEXT,
    "FramedIPAddress" TEXT,
    "FramedIPv6Address" TEXT,
    "FramedIPv6Prefix" TEXT,
    "FramedInterfaceId" TEXT,
    "DelegatedIPv6Prefix" TEXT,
    "Class" TEXT,

    CONSTRAINT "radacct_pkey" PRIMARY KEY ("RadAcctId")
);

-- CreateTable
CREATE TABLE "public"."radcheck" (
    "id" SERIAL NOT NULL,
    "UserName" TEXT NOT NULL,
    "Attribute" TEXT NOT NULL,
    "op" TEXT NOT NULL DEFAULT '==',
    "Value" TEXT NOT NULL,

    CONSTRAINT "radcheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."radreply" (
    "id" SERIAL NOT NULL,
    "UserName" TEXT NOT NULL,
    "Attribute" TEXT NOT NULL,
    "op" TEXT NOT NULL DEFAULT '=',
    "Value" TEXT NOT NULL,

    CONSTRAINT "radreply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."radgroupcheck" (
    "id" SERIAL NOT NULL,
    "GroupName" TEXT NOT NULL,
    "Attribute" TEXT NOT NULL,
    "op" TEXT NOT NULL DEFAULT '==',
    "Value" TEXT NOT NULL,

    CONSTRAINT "radgroupcheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."radgroupreply" (
    "id" SERIAL NOT NULL,
    "GroupName" TEXT NOT NULL,
    "Attribute" TEXT NOT NULL,
    "op" TEXT NOT NULL DEFAULT '=',
    "Value" TEXT NOT NULL,

    CONSTRAINT "radgroupreply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."radusergroup" (
    "id" SERIAL NOT NULL,
    "UserName" TEXT NOT NULL,
    "GroupName" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "radusergroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."radpostauth" (
    "id" BIGSERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "pass" TEXT,
    "reply" TEXT,
    "CalledStationId" TEXT,
    "CallingStationId" TEXT,
    "authdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Class" TEXT,

    CONSTRAINT "radpostauth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."nas" (
    "id" SERIAL NOT NULL,
    "nasname" TEXT NOT NULL,
    "shortname" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'other',
    "ports" INTEGER,
    "secret" TEXT NOT NULL,
    "server" TEXT,
    "community" TEXT,
    "description" TEXT,

    CONSTRAINT "nas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."nasreload" (
    "NASIPAddress" TEXT NOT NULL,
    "ReloadTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nasreload_pkey" PRIMARY KEY ("NASIPAddress")
);

-- CreateTable
CREATE TABLE "public"."AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RadiusServerConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "secret" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RadiusServerConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "radacct_AcctUniqueId_key" ON "public"."radacct"("AcctUniqueId");

-- CreateIndex
CREATE INDEX "radacct_active_session_idx" ON "public"."radacct"("AcctUniqueId");

-- CreateIndex
CREATE INDEX "radacct_bulk_close" ON "public"."radacct"("NASIPAddress", "AcctStartTime");

-- CreateIndex
CREATE INDEX "radacct_start_user_idx" ON "public"."radacct"("AcctStartTime", "UserName");

-- CreateIndex
CREATE INDEX "radacct_calss_idx" ON "public"."radacct"("Class");

-- CreateIndex
CREATE INDEX "radcheck_UserName" ON "public"."radcheck"("UserName", "Attribute");

-- CreateIndex
CREATE INDEX "radreply_UserName" ON "public"."radreply"("UserName", "Attribute");

-- CreateIndex
CREATE INDEX "radgroupcheck_GroupName" ON "public"."radgroupcheck"("GroupName", "Attribute");

-- CreateIndex
CREATE UNIQUE INDEX "radgroupcheck_GroupName_Attribute_op_Value" ON "public"."radgroupcheck"("GroupName", "Attribute", "op", "Value");

-- CreateIndex
CREATE INDEX "radgroupreply_GroupName" ON "public"."radgroupreply"("GroupName", "Attribute");

-- CreateIndex
CREATE UNIQUE INDEX "radgroupreply_GroupName_Attribute_op_Value" ON "public"."radgroupreply"("GroupName", "Attribute", "op", "Value");

-- CreateIndex
CREATE INDEX "radusergroup_UserName" ON "public"."radusergroup"("UserName");

-- CreateIndex
CREATE INDEX "radpostauth_username_idx" ON "public"."radpostauth"("username");

-- CreateIndex
CREATE INDEX "radpostauth_class_idx" ON "public"."radpostauth"("Class");

-- CreateIndex
CREATE INDEX "nas_nasname" ON "public"."nas"("nasname");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "public"."AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RadiusServerConfig_name_key" ON "public"."RadiusServerConfig"("name");
