import { Card } from "@repo/ui/card"
import { getServerSession } from "next-auth";
import { authOptions } from "../app/lib/auth";
import prisma from "@repo/db/client";

async function getP2PTransactions() {
    const session = await getServerSession(authOptions);
    const txns = await prisma.p2pTransfer.findMany({
        where: {
            fromUserId: Number(session?.user?.id)
        }
    });

    return txns.map(t => ({
        amount: t.amount,
        timeStamp: t.timestamp,
        toUserId: t.toUserId
    }))
}

export const OnRampTransactions = async ({
    transactions
}: {
    transactions: {
        time: Date,
        amount: number,
        // TODO: Can the type of `status` be more specific?
        status: string,
        provider: string
    }[]
}) => {
    if (!transactions.length) {
        return <Card title="Recent Transactions">
            <div className="text-center pb-8 pt-8">
                No Recent transactions
            </div>
        </Card>
    }

    const p2ptxn = await getP2PTransactions();

    return <Card title="Recent Transactions">
        <div className="pt-2">
            {transactions.map(t => <div className="flex justify-between">
                <div>
                    <div className="text-sm">
                        Received INR
                    </div>
                    <div className="text-slate-600 text-xs">
                        {t.time.toDateString()}
                    </div>
                </div>
                <div className="flex flex-col justify-center text-green-500">
                    + ₹ {t.amount / 100}
                </div>

            </div>)}

            {/* to show the p2p transactions */}
            {p2ptxn.map(t => <div className="flex justify-between">
                <div>
                    <div className="text-sm">
                        Send INR to Id {t.toUserId}
                    </div>
                    <div className="text-slate-600 text-xs">
                        {t.timeStamp.toDateString()}
                    </div>
                </div>
                <div className="flex flex-col justify-center text-red-500">
                    - ₹ {t.amount / 100}
                </div>
            </div>)}

        </div>
    </Card>
}