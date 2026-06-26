import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ seller_id: string }> }
) {
  return withAuth(async (session, req) => {
    const { seller_id } = await params;

    // Ensure the seller can only submit their own KYC
    if (session.userId !== seller_id) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 403 });
    }

    if (session.role !== "SELLER") {
      return NextResponse.json({ detail: "Only sellers can submit KYC" }, { status: 403 });
    }

    const body = await req.json();
    const { businessName, gstin, phone, address, city, state, pincode } = body;

    if (!businessName?.trim()) {
      return NextResponse.json({ detail: "Business name is required" }, { status: 400 });
    }

    if (!phone?.trim()) {
      return NextResponse.json({ detail: "Phone is required" }, { status: 400 });
    }

    try {
      // Check if KYC already exists
      const existing = await prisma.sellerVerification.findUnique({
        where: { seller_id },
      });

      if (existing) {
        // Update existing KYC
        await prisma.sellerVerification.update({
          where: { seller_id },
          data: {
            business_name: businessName,
            gstin: gstin || null,
            phone,
            address: address || null,
            city: city || null,
            state: state || null,
            pincode: pincode || null,
            status: "PENDING", // Reset status to PENDING on resubmission
          },
        });
      } else {
        // Create new KYC
        await prisma.sellerVerification.create({
          data: {
            seller_id,
            business_name: businessName,
            gstin: gstin || null,
            phone,
            address: address || null,
            city: city || null,
            state: state || null,
            pincode: pincode || null,
            status: "PENDING",
          },
        });
      }

      return NextResponse.json({ message: "KYC submitted successfully" }, { status: 201 });
    } catch (error) {
      console.error("KYC submission error:", error);
      return NextResponse.json({ detail: "Failed to submit KYC" }, { status: 500 });
    }
  }, request, ["SELLER"]);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ seller_id: string }> }
) {
  return withAuth(async (session, req) => {
    const { seller_id } = await params;

    // Ensure the seller can only view their own KYC
    if (session.userId !== seller_id) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 403 });
    }

    try {
      const kyc = await prisma.sellerVerification.findUnique({
        where: { seller_id },
      });

      if (!kyc) {
        return NextResponse.json({ kyc: null }, { status: 200 });
      }

      return NextResponse.json({ kyc }, { status: 200 });
    } catch (error) {
      console.error("KYC fetch error:", error);
      return NextResponse.json({ detail: "Failed to fetch KYC" }, { status: 500 });
    }
  }, request, ["SELLER"]);
}
