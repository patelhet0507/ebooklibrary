import { prisma } from "@/lib/prisma"
import { randomUUID } from "crypto"
import { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  const body = await request.json()

  const transaction = await prisma.transaction.findUnique({
    where: { id: body.transaction_id },
  })
  if (!transaction) {
    return Response.json({ detail: "Transaction not found" }, { status: 404 })
  }

  const existingPayment = await prisma.payment.findUnique({
    where: { transaction_id: body.transaction_id },
  })

  if (existingPayment) {
    if (existingPayment.status === "COMPLETED") {
      return Response.json(existingPayment)
    }

    const updated = await prisma.payment.update({
      where: { id: existingPayment.id },
      data: {
        method: body.method,
        upi_id: body.upi_id,
        bank_name: body.bank_name,
        account_number: body.account_number,
        ifsc_code: body.ifsc_code,
        delivery_name: body.delivery_name,
        delivery_phone: body.delivery_phone,
        delivery_address: body.delivery_address,
      },
    })

    if (body.method !== "COD") {
      await prisma.payment.update({
        where: { id: existingPayment.id },
        data: { status: "COMPLETED" },
      })
      const xpAmount = Math.floor(transaction.total_amount * 10)
      const user = await prisma.user.findUnique({ where: { id: transaction.customer_id } })
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { xp: user.xp + xpAmount, level: Math.floor((user.xp + xpAmount) / 1000) + 1 },
        })
      }
    }

    return Response.json(updated)
  }

  const paymentData: Record<string, unknown> = {
    id: randomUUID(),
    transaction_id: body.transaction_id,
    user_id: transaction.customer_id,
    method: body.method,
    amount: transaction.total_amount,
    status: body.method !== "COD" ? "COMPLETED" : "PENDING",
    upi_id: body.upi_id,
    bank_name: body.bank_name,
    account_number: body.account_number,
    ifsc_code: body.ifsc_code,
    delivery_name: body.delivery_name,
    delivery_phone: body.delivery_phone,
    delivery_address: body.delivery_address,
  }

  const payment = await prisma.payment.create({ data: paymentData as any })

  if (body.method !== "COD") {
    const xpAmount = Math.floor(transaction.total_amount * 10)
    const user = await prisma.user.findUnique({ where: { id: transaction.customer_id } })
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { xp: user.xp + xpAmount, level: Math.floor((user.xp + xpAmount) / 1000) + 1 },
      })
    }
  }

  return Response.json(payment, { status: 201 })
}
