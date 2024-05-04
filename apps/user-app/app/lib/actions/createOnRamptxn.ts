"use server"

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import prisma from "@repo/db/client";

export async function createOnRamptxn(amount: number, provider: string) {
    const session = await getServerSession(authOptions);
    const userId = session.user.id;
    const token = Math.random().toString();

    if(!userId) {
        return {
            message: "You are not logged in!"
        }
    }

    await prisma.onRampTransaction.create({
        data: {
            userId: Number(userId),
            amount: amount,         
            // store * 100 coz there can be decimals, did this in frontend
            status: "Processing",
            startTime: new Date(),
            provider,
            token
        }
    })

    return {
        message: "On ramp transaction added"
    }
}