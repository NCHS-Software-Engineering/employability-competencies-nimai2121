import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import connection from "@/app/lib/db";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({error: "Not Authenticated"}, {status: 401})
    }

    const entryId = params.id;
    const userEmail = session.user.email;
        console.log("[api/entry/[id] DELETE] called", { entryId, userEmail });

    await connection.execute(
        "DELETE FROM EntryCompetency WHERE entryID = ?",
        [entryId]
    );

    const [result]: any = await connection.execute(
        "DELETE FROM Entry WHERE id = ? AND user = ?",
        [entryId, userEmail]
    );

        if (result.affectedRows === 0) {
            console.log("[api/entry/[id] DELETE] nothing deleted", { result });
            return NextResponse.json({error: "Not found"}, {status: 404});
        }

        console.log("[api/entry/[id] DELETE] success", { result });
        return NextResponse.json({message: "Deleted"});
    } catch (err) {
        console.error("Delete error:", err);
        return NextResponse.json({error: "Failed"}, {status: 500});
    }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({error: "Not Authenticated"}, {status: 401})
    }

    const entryId = params.id;
    const userEmail = session.user.email;
    const { text, competencyIDs } = await req.json();

    const [result]: any = await connection.execute(
        "UPDATE Entry SET text = ? WHERE id = ? AND user = ?",
        [text, entryId, userEmail]
    );

    if (result.affectedRows === 0) {
        return NextResponse.json({error: "Not found"}, {status: 404});
    }

    await connection.execute(
        "DELETE FROM EntryCompetency WHERE entryID = ?",
        [entryId]
    );

    for (const compID of competencyIDs) {
        await connection.execute(
            "INSERT INTO EntryCompetency (entryID, competencyID) VALUES (?, ?)",
            [entryId, compID]
        );
    }

    return NextResponse.json({message: "Updated"});
    } catch (err) {
        console.error("Update error:", err);
        return NextResponse.json({error: "Failed"}, {status: 500});
    }
}
