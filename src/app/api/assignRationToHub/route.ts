import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { hubId, rationData } = await req.json();

        if (!hubId || !rationData) {
            throw new Error("Hub ID and ration data are required")
        }

        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 6);

        const updatedRations = await Promise.all(
            rationData.map(async (rationItem: Product) => {
                const { id, name, quantity } = rationItem

                const existingRation = await db.ration.findUnique({
                    where: { name }
                })

                if (existingRation) {
                    const updatedExistingRation = await db.ration.update({
                        where: { id: existingRation.id },
                        data: {
                            id: existingRation.id,
                            name: existingRation.name,
                            quantity: existingRation.quantity + quantity,
                            expiryDate
                        }
                    })
                    return updatedExistingRation;
                } else {
                    const createdRations = await Promise.all(rationData.map(async (rationItem: Product) => {
                        const { id, name, quantity } = rationItem;

                        const createdRation = await db.ration.create({
                            data: {
                                name,
                                quantity: quantity,
                                expiryDate,
                                hubs: {
                                    connect: { id: hubId }
                                },
                            }
                        })
                        return createdRation;
                    }))
                }
            })
        )

        return NextResponse.json({
            status: "success",
            message: "Ration data posted successfully",
            data: updatedRations
        });
    } catch (error: any) {
        return new NextResponse(
            JSON.stringify({
                status: "error",
                message: error.message,
            }),
            { status: 500 }
        );
    }
}