import { BookOpen } from 'lucide-react';

export default function DocumentationTab() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <BookOpen className="w-6 h-6 text-[#1B2D3C]" />
        <h2 className="font-heading text-2xl font-black text-[#1B2D3C]">System Documentation</h2>
      </div>
      <p className="text-sm text-[#1B2D3C]/60">Complete rules, capacity limits, and operational logic for the Pitter Potter booking system.</p>

      {/* Studios */}
      <Section title="Studios">
        <p>Two studios: <strong>Putney</strong> and <strong>Wimbledon</strong>. Each has a "front" area (open painting) and a "back" area (parties).</p>
      </Section>

      {/* Session Types */}
      <Section title="Session Types">
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Painting</strong> — open painting sessions, bookable online</li>
          <li><strong>Baby Prints</strong> (clay-imprints) — baby hand/foot impressions, bookable online</li>
          <li><strong>Birthday Party</strong> — party booking, requires £50 deposit</li>
          <li><strong>Baby Shower / Hen Party</strong> — party booking, requires £50 deposit</li>
          <li><strong>Corporate Event</strong> — party booking, requires £50 deposit</li>
        </ul>
      </Section>

      {/* Time Slots */}
      <Section title="Time Slots">
        <SubSection title="Painting & Baby Prints">
          <p>30-minute intervals: <code className="bg-[#DBE7E4] px-1 rounded text-xs">10:00, 10:30, 12:00, 12:30, 14:00, 14:30, 16:00, 16:30</code></p>
          <p className="mt-1">Baby Prints has additional slots: <code className="bg-[#DBE7E4] px-1 rounded text-xs">11:00, 11:30, 13:00, 13:30, 15:00, 15:30</code></p>
          <p className="mt-1 text-xs text-[#1B2D3C]/60">Slots differ by weekday/weekend (admin-configurable). Past slots are hidden on the current day.</p>
        </SubSection>
        <SubSection title="Party Slots">
          <p>2-hour ranges: <code className="bg-[#DBE7E4] px-1 rounded text-xs">10:00-12:00, 12:30-14:30, 15:00-17:00</code></p>
        </SubSection>
      </Section>

      {/* Opening Days */}
      <Section title="Opening Days">
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Mondays: Closed</strong> (disabled in calendar, unless during school holidays for parties)</li>
          <li><strong>Tuesday–Sunday: Open</strong></li>
          <li>Admin can set specific closed dates per studio or both</li>
          <li>School holiday date ranges can be configured (affects Monday party availability)</li>
        </ul>
      </Section>

      {/* Capacity Rules */}
      <Section title="Capacity Rules">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-[#1B2D3C]/15 rounded-lg overflow-hidden">
            <thead className="bg-[#DBE7E4]">
              <tr>
                <th className="text-left p-3 font-bold text-[#1B2D3C]">Capacity</th>
                <th className="text-center p-3 font-bold text-[#1B2D3C]">Putney</th>
                <th className="text-center p-3 font-bold text-[#1B2D3C]">Wimbledon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1B2D3C]/10">
              <tr><td className="p-3">Open painting (full studio)</td><td className="text-center p-3 font-bold">32 seats</td><td className="text-center p-3 font-bold">58 seats</td></tr>
              <tr className="bg-[#FAFAFA]"><td className="p-3">Open painting (party present — front only)</td><td className="text-center p-3 font-bold">15 seats</td><td className="text-center p-3 font-bold">32 seats</td></tr>
              <tr><td className="p-3">Party capacity</td><td className="text-center p-3 font-bold">20 seats</td><td className="text-center p-3 font-bold">26 seats</td></tr>
              <tr className="bg-[#FAFAFA]"><td className="p-3">Max concurrent parties</td><td className="text-center p-3 font-bold">1</td><td className="text-center p-3 font-bold">2</td></tr>
              <tr><td className="p-3">Max bookings per slot (open)</td><td className="text-center p-3 font-bold">99</td><td className="text-center p-3 font-bold">17</td></tr>
              <tr className="bg-[#FAFAFA]"><td className="p-3">Max bookings per slot (restricted)</td><td className="text-center p-3 font-bold">99</td><td className="text-center p-3 font-bold">10</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-[#1B2D3C]/60 mt-2">All capacities can be overridden via the <code className="bg-[#DBE7E4] px-1 rounded">capacity</code> database table in Settings.</p>

        <SubSection title="How Capacity Works">
          <ul className="list-disc list-inside space-y-1">
            <li><strong>2-hour overlap window</strong> — bookings within 2 hours of each other count as the same slot</li>
            <li><strong>Party bookings</strong> occupy the back area. When a party is booked, open painting is restricted to front-area capacity only</li>
            <li><strong>Concurrent parties</strong> — Putney allows 1 party per slot, Wimbledon allows 2</li>
            <li><strong>Party seats are shared</strong> — if Wimbledon has 2 parties running, both share the 26-seat party capacity</li>
            <li><strong>Status counts</strong> — both <code className="bg-[#DBE7E4] px-1 rounded text-xs">pending</code> and <code className="bg-[#DBE7E4] px-1 rounded text-xs">confirmed</code> bookings count toward capacity</li>
            <li><strong>Cancelled / no-show</strong> bookings do NOT count toward capacity</li>
          </ul>
        </SubSection>

        <SubSection title="Capacity Enforcement">
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Public bookings</strong> (painting, baby prints, parties): Hard block — can't book if over capacity. Server-side validation.</li>
            <li><strong>Admin/staff bookings</strong>: Soft warning — staff can deliberately overbook (walk-ins, squeezing in regulars). Warning shown but booking allowed.</li>
          </ul>
        </SubSection>
      </Section>

      {/* Party Booking Rules */}
      <Section title="Party Booking Rules">
        <SubSection title="Guest Limits">
          <p>Max <strong>16 guests</strong> per party at both studios. For larger groups, customers are directed to call.</p>
        </SubSection>
        <SubSection title="Pricing">
          <ul className="list-disc list-inside space-y-1">
            <li><strong>£28.95 per head</strong> (birthday parties, baby shower/hen parties)</li>
            <li><strong>Custom pricing</strong> for corporate events</li>
            <li><strong>£50 deposit</strong> required upfront</li>
            <li>Final balance = <code className="bg-[#DBE7E4] px-1 rounded text-xs">(guest count × £28.95) - £50 deposit</code></li>
            <li>Final seat count confirmed 48 hours before party via email</li>
          </ul>
        </SubSection>
        <SubSection title="Payment Flow">
          <ol className="list-decimal list-inside space-y-1">
            <li>Customer fills in party details (name, phone, date, time, guest count, notes)</li>
            <li>Server validates capacity before creating Stripe payment intent</li>
            <li><strong>No booking exists in the database until £50 deposit is paid</strong></li>
            <li>All booking data stored in Stripe payment intent metadata</li>
            <li>Customer pays £50 via Stripe Elements</li>
            <li><code className="bg-[#DBE7E4] px-1 rounded text-xs">confirm-party-payment</code> verifies payment, creates booking in DB</li>
            <li>Stripe webhook acts as backup (idempotent — won't duplicate)</li>
            <li>Booking created with <code className="bg-[#DBE7E4] px-1 rounded text-xs">status: confirmed</code>, <code className="bg-[#DBE7E4] px-1 rounded text-xs">payment_status: paid</code></li>
            <li>Confirmation email sent to customer + admin notification created</li>
            <li>If customer abandons payment: <strong>nothing exists</strong> — no booking, no admin entry, no capacity held</li>
          </ol>
        </SubSection>
      </Section>

      {/* Painting & Baby Prints */}
      <Section title="Painting & Baby Prints Booking Rules">
        <SubSection title="Required Fields">
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Painting</strong>: Date, time, name, phone, painters count</li>
            <li><strong>Baby Prints</strong>: Date, time, name, email, phone</li>
          </ul>
        </SubSection>
        <SubSection title="Validation">
          <ul className="list-disc list-inside space-y-1">
            <li>Email validated with regex if provided (painting) or required (baby prints)</li>
            <li>Phone required (max 30 chars)</li>
            <li>Name required (max 200 chars)</li>
            <li>Painters count: 1–100</li>
            <li>Date must be future, <code className="bg-[#DBE7E4] px-1 rounded text-xs">YYYY-MM-DD</code> format</li>
          </ul>
        </SubSection>
        <SubSection title="Payment">
          <p><strong>No upfront payment</strong> for painting or baby prints. Booking created directly in DB with <code className="bg-[#DBE7E4] px-1 rounded text-xs">status: pending</code>. Confirmation email sent immediately. Payment settled in-studio.</p>
        </SubSection>
      </Section>

      {/* Gift Cards */}
      <Section title="Gift Card Rules">
        <SubSection title="Purchase">
          <ul className="list-disc list-inside space-y-1">
            <li>Preset amounts: £10, £20, £25, £30, £50</li>
            <li>Custom amounts allowed (max £500)</li>
            <li>Required: recipient name, recipient email, sender name, sender email</li>
            <li>Optional: message</li>
            <li>Payment via Stripe before gift card is created</li>
            <li>Code format: <code className="bg-[#DBE7E4] px-1 rounded text-xs">PP-</code> + 10 random characters (no ambiguous chars)</li>
            <li>Valid for 1 year from purchase</li>
          </ul>
        </SubSection>
        <SubSection title="Redemption">
          <p>Can be redeemed against bookings. Gift card code applied at checkout for painting sessions. Balance tracked and reduced per use.</p>
        </SubSection>
      </Section>

      {/* Calendar Logic */}
      <Section title="Calendar / Busy Date Logic">
        <ul className="list-disc list-inside space-y-1">
          <li>A date is marked as <strong>busy</strong> (disabled in calendar) when ALL 4 standard slots are fully booked</li>
          <li>Party bookings with time ranges (e.g. <code className="bg-[#DBE7E4] px-1 rounded text-xs">12:30-14:30</code>) are matched using 2-hour overlap logic</li>
          <li>If a party occupies a slot, open painting capacity is checked against restricted capacity</li>
          <li>If concurrent party spaces are full and party seats are maxed, that slot is busy</li>
        </ul>
      </Section>

      {/* Rate Limiting */}
      <Section title="Rate Limiting">
        <ul className="list-disc list-inside space-y-1">
          <li><strong>10 requests/min per IP</strong> — create-booking, create-party-deposit-payment, create-gift-card-payment, staff-login</li>
          <li><strong>30 requests/min per IP</strong> — get-capacity, get-busy-dates</li>
        </ul>
      </Section>

      {/* Admin Roles */}
      <Section title="Admin Roles & Permissions">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-[#1B2D3C]/15 rounded-lg overflow-hidden">
            <thead className="bg-[#DBE7E4]">
              <tr>
                <th className="text-left p-3 font-bold text-[#1B2D3C]">Role</th>
                <th className="text-left p-3 font-bold text-[#1B2D3C]">Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1B2D3C]/10">
              <tr><td className="p-3 font-bold">super_admin</td><td className="p-3">All studios, all features, all settings</td></tr>
              <tr className="bg-[#FAFAFA]"><td className="p-3 font-bold">admin</td><td className="p-3">Assigned studios only, most features</td></tr>
              <tr><td className="p-3 font-bold">staff</td><td className="p-3">Assigned studios only, limited features</td></tr>
            </tbody>
          </table>
        </div>
        <ul className="list-disc list-inside space-y-1 mt-3">
          <li><code className="bg-[#DBE7E4] px-1 rounded text-xs">can_add_walk_ins</code> permission required to create bookings from admin</li>
          <li>Staff can overbook (capacity is advisory, not blocking)</li>
          <li>All admin actions logged in <code className="bg-[#DBE7E4] px-1 rounded text-xs">audit_logs</code> table</li>
          <li>Session token required for all admin API calls</li>
        </ul>
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        <ul className="list-disc list-inside space-y-1">
          <li><strong>New booking</strong> — admin notification created for every new booking</li>
          <li><strong>Party booking</strong> — notification only after deposit paid</li>
          <li>Notification types: booking_new, booking_cancelled, booking_rescheduled, gift_card_sold, etc.</li>
          <li>Notification settings per studio or global</li>
          <li>iOS admin app polls for unread notifications every 30 seconds</li>
        </ul>
      </Section>

      {/* Stripe */}
      <Section title="Stripe Configuration">
        <ul className="list-disc list-inside space-y-1">
          <li>Two modes: <strong>sandbox</strong> and <strong>live</strong> (switched via <code className="bg-[#DBE7E4] px-1 rounded text-xs">stripe_mode</code> setting in database)</li>
          <li>Separate secret keys and publishable keys for each mode</li>
          <li>Webhook secrets for each mode</li>
          <li>All payment data stored in Stripe metadata for webhook processing</li>
        </ul>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#1B2D3C]/10 rounded-xl p-6 space-y-3">
      <h3 className="font-heading text-lg font-black text-[#1B2D3C] border-b border-[#1B2D3C]/10 pb-2">{title}</h3>
      <div className="text-sm text-[#1B2D3C]/80 space-y-2">{children}</div>
    </div>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <h4 className="text-xs font-bold uppercase tracking-wider text-[#1B2D3C]/60 mb-1">{title}</h4>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
