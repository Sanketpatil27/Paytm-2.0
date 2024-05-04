"use server"

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import prisma from "@repo/db/client";

export async function p2pTransfer(to: string, amount: number) {         // to is phone number that we send from SendCard
    const session = await getServerSession(authOptions);
    const from = session?.user?.id;
    if (!from) {
        return {
            message: "Error while sending"
        }
    }

    const toUser = await prisma.user.findFirst({
        where: {
            number: to
        }
    });

    if (!toUser) {
        return {
            message: "User not found"
        }
    }

    await prisma.$transaction(async (tx) => {
        // to lock rows, prisma doesn't supports locks, we have to do it explicitly using raw query
        // it helps when same user tries to pay simultenously and goes under negative balance
        // it first complete the 1 process of transaction then let other transaction use the next rows
        await tx.$queryRaw`SELECT * FROM "Balance" WHERE "userId" = ${Number(from)} FOR UPDATE`;

        const fromBalance = await tx.balance.findUnique({
            where: { userId: Number(from) },
        });

        if (!fromBalance || fromBalance.amount < amount) {
            throw new Error('Insufficient funds');
        }

        // mannual delay to check if parellel request done what 
        // console.log("above sleep");
        // await new Promise(r => setTimeout(r, 4000));
        // console.log("after sleep");

        await tx.balance.update({
            where: { userId: Number(from) },
            data: { amount: { decrement: amount } },
        });

        await tx.balance.update({
            where: { userId: toUser.id },
            data: { amount: { increment: amount } },
        });

        // make entry in table of this P2P transfer
        await tx.p2pTransfer.create({
            data: {
                fromUserId: Number(from),
                toUserId: toUser.id,
                timestamp: new Date(),
                amount,
            }
        })
    });
}