import { NextResponse } from "next/server";
import { parseYMD } from "@/lib/date";
import { estimatePriceCents, formatDollars } from "@/lib/pricing";

function toLocalDateTime(dateStr: string, timeStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  const dt = new Date();
  dt.setFullYear(y, (m ?? 1) - 1, d ?? 1);
  dt.setHours(hh ?? 0, mm ?? 0, 0, 0);
  return dt;
}

export async function POST(req: Request) {
  // Dynamic imports prevent build-time “collect page data” failures
  const { prisma } = await import("@/lib/db");
  const { Resend } = await import("resend");

  const form = await req.formData();

  const dateStr = String(form.get("date") ?? "").trim();
  const pickupTimeStr = String(form.get("pickupTime") ?? "").trim();
  const pickupLocation = String(form.get("pickupLocation") ?? "").trim();
  const dropoffLocation = String(form.get("dropoffLocation") ?? "").trim();
  const passengerName = String(form.get("passengerName") ?? "").trim();

  if (!dateStr || !pickupTimeStr || !pickupLocation || !dropoffLocation || !passengerName) {
    return NextResponse.redirect(new URL("/book?err=missing", req.url));
  }

  const date = parseYMD(dateStr);
  const pickupTime = toLocalDateTime(dateStr, pickupTimeStr);

  const rideType = String(form.get("rideType") ?? "OTHER") as "TO_AIRPORT" | "FROM_AIRPORT" | "OTHER";
  const airport = String(form.get("airport") ?? "").trim() || null;
  const flightNumber = String(form.get("flightNumber") ?? "").trim() || null;
  const passengerPhone = String(form.get("passengerPhone") ?? "").trim() || null;
  const passengerEmail = String(form.get("passengerEmail") ?? "").trim() || null;
  const partySize = Number(form.get("partySize") ?? 1);
  const specialNotes = String(form.get("specialNotes") ?? "").trim() || null;

  const partySizeSafe = Number.isFinite(partySize) && partySize > 0 ? partySize : 1;

  const estimatedPriceCentsValue = estimatePriceCents({
    rideType,
    partySize: partySizeSafe,
    pickupTimeStr,
    airport,
  });

  const created = await prisma.ride.create({
    data: {
      date,
      pickupTime,
      pickupLocation,
      dropoffLocation,
      airport,
      flightNumber,
      passengerName,
      passengerPhone,
      passengerEmail,
      partySize: partySizeSafe,
      luggageCount: 0,
      rideType,
      specialNotes,
      status: "REQUESTED",
      estimatedPriceCents: estimatedPriceCentsValue,
    },
    select: { id: true },
  });

  // Send confirmation emails via Resend (best-effort)
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.BOOKING_FROM_EMAIL;

    if (apiKey && from) {
      const resend = new Resend(apiKey);
      const dollars = formatDollars(estimatedPriceCentsValue);
      const baseUrl = process.env.PUBLIC_BASE_URL ?? "http://localhost:3000";
      const thanksUrl = `${baseUrl}/book/thanks/${created.id}`;

      const html = `
        <div style="font-family:Arial,sans-serif;line-height:1.5">
          <h2>Request received</h2>
          <p>Hi ${passengerName},</p>
          <p>We received your shuttle request. We’ll confirm your driver and pickup details shortly.</p>
          <p>
            <b>Date:</b> ${dateStr}<br/>
            <b>Pickup:</b> ${pickupTimeStr} — ${pickupLocation}<br/>
            <b>Dropoff:</b> ${dropoffLocation}<br/>
            <b>Estimated price:</b> $${dollars}<br/>
            <b>Reference:</b> ${created.id}
          </p>
          <p><a href="${thanksUrl}">View your request</a></p>
          <p style="color:#666;font-size:12px">
            This is an estimate. Final price may vary based on changes or additional stops.
          </p>
        </div>
      `;

      if (passengerEmail) {
        await resend.emails.send({
          from,
          to: passengerEmail,
          subject: `Shuttle request received (${dateStr} ${pickupTimeStr})`,
          html,
        });
      }

      const notify = process.env.BOOKING_NOTIFY_EMAIL;
      if (notify) {
        await resend.emails.send({
          from,
          to: notify,
          subject: `NEW REQUEST: ${passengerName} (${dateStr} ${pickupTimeStr})`,
          html,
        });
      }
    }
  } catch (e) {
    console.error("[RESEND ERROR]", e);
  }

  return NextResponse.redirect(new URL(`/book/thanks/${created.id}`, req.url));
}