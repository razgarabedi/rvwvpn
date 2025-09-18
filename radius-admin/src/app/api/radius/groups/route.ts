import { NextRequest, NextResponse } from "next/server"
import { PrismaClient, Prisma } from "@prisma/client"
import { getServerSession } from "next-auth"

const prisma = new PrismaClient()

// GET /api/radius/groups - Fetch all RADIUS groups
export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const groupCheckNames = await prisma.radGroupCheck.findMany({
      select: { groupname: true },
      distinct: ['groupname'],
    });
    const groupReplyNames = await prisma.radGroupReply.findMany({
      select: { groupname: true },
      distinct: ['groupname'],
    });
    
    const allGroupNames = [...new Set([...groupCheckNames.map((g: { groupname: string }) => g.groupname), ...groupReplyNames.map((g: { groupname: string }) => g.groupname)])]
      .sort();

    const groups = allGroupNames.map(name => ({ groupname: name }));

    const groupChecks = await prisma.radGroupCheck.findMany({
      orderBy: { groupname: 'asc' },
    });

    const groupReplies = await prisma.radGroupReply.findMany({
      orderBy: { groupname: 'asc' },
    });

    const groupData = groups.map((group) => ({
      name: group.groupname,
      checks: groupChecks.filter((check: { groupname: string }) => check.groupname === group.groupname),
      replies: groupReplies.filter((reply: { groupname: string }) => reply.groupname === group.groupname),
    }));

    return NextResponse.json(groupData);
  } catch (error) {
    console.error("Error fetching RADIUS groups:", error);
    return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 });
  }
}

// POST /api/radius/groups - Create a new RADIUS group
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, checks = [], replies = [] } = body

    if (!name) {
      return NextResponse.json({ error: "Group name is required" }, { status: 400 });
    }

    const existingGroup = await prisma.radGroupCheck.findFirst({
      where: { groupname: name }
    });
    const existingGroupReply = await prisma.radGroupReply.findFirst({
      where: { groupname: name }
    });

    if (existingGroup || existingGroupReply) {
      return NextResponse.json({ error: "Group already exists" }, { status: 409 });
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const checkData = checks
        .filter((c: { attribute: string }) => c.attribute)
        .map((check: { attribute: string; op: string; value: string }) => ({
          groupname: name,
          attribute: check.attribute,
          op: check.op || '==',
          value: check.value,
        }));
      
      if (checkData.length > 0) {
        await tx.radGroupCheck.createMany({ data: checkData });
      }

      const replyData = replies
        .filter((r: { attribute: string }) => r.attribute)
        .map((reply: { attribute: string; op: string; value: string }) => ({
          groupname: name,
          attribute: reply.attribute,
          op: reply.op || '=',
          value: reply.value,
        }));

      if (replyData.length > 0) {
        await tx.radGroupReply.createMany({ data: replyData });
      }

      if (checkData.length === 0 && replyData.length === 0) {
        await tx.radGroupCheck.create({
          data: {
            groupname: name,
            attribute: 'Auth-Type',
            op: ':=',
            value: 'Accept',
          },
        });
      }
    });

    return NextResponse.json({ message: "Group created successfully" }, { status: 201 });
  } catch (error) {
    console.error("Error creating RADIUS group:", error);
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
  }
}

// PUT /api/radius/groups - Update a RADIUS group
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, checks = [], replies = [] } = body;

    if (!name) {
      return NextResponse.json({ error: "Group name is required" }, { status: 400 });
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.radGroupCheck.deleteMany({ where: { groupname: name } });
      await tx.radGroupReply.deleteMany({ where: { groupname: name } });

      const checkData = checks
        .filter((c: { attribute: string }) => c.attribute)
        .map((check: { attribute: string; op: string; value: string }) => ({
          groupname: name,
          attribute: check.attribute,
          op: check.op,
          value: check.value,
        }));

      if (checkData.length > 0) {
        await tx.radGroupCheck.createMany({ data: checkData });
      }

      const replyData = replies
        .filter((r: { attribute: string }) => r.attribute)
        .map((reply: { attribute: string; op: string; value: string }) => ({
          groupname: name,
          attribute: reply.attribute,
          op: reply.op,
          value: reply.value,
        }));

      if (replyData.length > 0) {
        await tx.radGroupReply.createMany({ data: replyData });
      }
    });

    return NextResponse.json({ message: "Group updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error updating RADIUS group:", error);
    return NextResponse.json({ error: "Failed to update group" }, { status: 500 });
  }
}

// DELETE /api/radius/groups - Delete a RADIUS group
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 }
      )
    }

    // Delete group check attributes
    await prisma.radGroupCheck.deleteMany({
      where: {
        groupname: name
      }
    })

    // Delete group reply attributes
    await prisma.radGroupReply.deleteMany({
      where: {
        groupname: name
      }
    })

    return NextResponse.json({ message: "Group deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting RADIUS group:", error)
    return NextResponse.json(
      { error: "Failed to delete group" },
      { status: 500 }
    )
  }
}
