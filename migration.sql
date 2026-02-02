-- ============================================================================
-- Airbnb-Style Booking System Migration
-- Transforms Room MVP (multi-slot) to single-room checkout sessions & bookings
-- ============================================================================

-- Step 1: Add new columns to listings table
-- ============================================================================
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS available_from DATE,
  ADD COLUMN IF NOT EXISTS available_to DATE,
  ADD COLUMN IF NOT EXISTS min_term_months INTEGER DEFAULT 1;

-- Add constraint for status
ALTER TABLE listings
  ADD CONSTRAINT listings_status_check
  CHECK (status IN ('available', 'booked'));

-- Set all existing listings to available
UPDATE listings SET status = 'available' WHERE status IS NULL;


-- Step 2: Create checkout_sessions table
-- ============================================================================
CREATE TABLE IF NOT EXISTS checkout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  state TEXT NOT NULL CHECK (state IN ('active', 'expired', 'completed', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL,

  -- Snapshot data (frozen at checkout start)
  price_snapshot DECIMAL(10,2) NOT NULL,
  deposit_snapshot DECIMAL(10,2),
  utilities_snapshot DECIMAL(10,2),
  start_date_snapshot DATE,
  end_date_snapshot DATE,

  -- Payment integration
  stripe_session_id TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraints for checkout sessions
-- Only 1 active checkout per listing
CREATE UNIQUE INDEX IF NOT EXISTS idx_checkout_sessions_listing_active
  ON checkout_sessions(listing_id)
  WHERE state = 'active';

-- Only 1 active checkout per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_checkout_sessions_user_active
  ON checkout_sessions(user_id)
  WHERE state = 'active';

-- Regular indexes
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_listing_state
  ON checkout_sessions(listing_id, state);

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_user_state
  ON checkout_sessions(user_id, state);

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_expires
  ON checkout_sessions(expires_at)
  WHERE state = 'active';


-- Step 3: Create bookings table
-- ============================================================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  renter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  checkout_session_id UUID REFERENCES checkout_sessions(id),

  -- Booking details
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  monthly_rent DECIMAL(10,2) NOT NULL,
  deposit_paid DECIMAL(10,2),
  utilities_included BOOLEAN DEFAULT false,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),

  -- Payment
  stripe_payment_intent_id TEXT,
  amount_paid DECIMAL(10,2),
  payment_status TEXT
    CHECK (payment_status IN ('pending', 'succeeded', 'failed', 'refunded')),

  -- Agreement
  agreement_url TEXT,
  agreement_signed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for bookings
CREATE INDEX IF NOT EXISTS idx_bookings_listing
  ON bookings(listing_id);

CREATE INDEX IF NOT EXISTS idx_bookings_renter
  ON bookings(renter_id);

CREATE INDEX IF NOT EXISTS idx_bookings_host
  ON bookings(host_id);

CREATE INDEX IF NOT EXISTS idx_bookings_status
  ON bookings(status);

CREATE INDEX IF NOT EXISTS idx_bookings_dates
  ON bookings(start_date, end_date);


-- Step 4: Migrate existing commitments to bookings (optional)
-- ============================================================================
-- This preserves existing commitment data as bookings
-- Only migrate active or completed commitments

INSERT INTO bookings (
  listing_id,
  renter_id,
  host_id,
  start_date,
  end_date,
  monthly_rent,
  utilities_included,
  status,
  created_at
)
SELECT
  c.listing_id,
  c.user_id as renter_id,
  l.user_id as host_id,
  COALESCE(l.start_date, CURRENT_DATE) as start_date,
  COALESCE(l.end_date, CURRENT_DATE + INTERVAL '1 month') as end_date,
  COALESCE(l.price_per_spot, l.price_monthly) as monthly_rent,
  false as utilities_included,
  CASE
    WHEN c.status = 'active' THEN 'pending'
    WHEN c.status = 'completed' THEN 'confirmed'
    ELSE 'cancelled'
  END as status,
  c.created_at
FROM commitments c
JOIN listings l ON c.listing_id = l.id
WHERE c.status IN ('active', 'completed')
ON CONFLICT DO NOTHING;


-- Step 5: Create updated_at triggers
-- ============================================================================
-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to checkout_sessions
DROP TRIGGER IF EXISTS update_checkout_sessions_updated_at ON checkout_sessions;
CREATE TRIGGER update_checkout_sessions_updated_at
  BEFORE UPDATE ON checkout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to bookings
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- Step 6: Enable Row Level Security (RLS)
-- ============================================================================
ALTER TABLE checkout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Checkout Sessions RLS Policies
-- Users can view their own checkout sessions
CREATE POLICY "Users can view own checkout sessions"
  ON checkout_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own checkout sessions
CREATE POLICY "Users can create checkout sessions"
  ON checkout_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own checkout sessions
CREATE POLICY "Users can update own checkout sessions"
  ON checkout_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Listing owners can view checkout sessions for their listings
CREATE POLICY "Hosts can view checkout sessions for their listings"
  ON checkout_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = checkout_sessions.listing_id
      AND listings.user_id = auth.uid()
    )
  );


-- Bookings RLS Policies
-- Users can view bookings where they are renter or host
CREATE POLICY "Users can view their bookings"
  ON bookings FOR SELECT
  USING (
    auth.uid() = renter_id
    OR auth.uid() = host_id
  );

-- Users can create bookings as renter
CREATE POLICY "Users can create bookings as renter"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = renter_id);

-- Users can update bookings where they are renter or host
CREATE POLICY "Users can update their bookings"
  ON bookings FOR UPDATE
  USING (
    auth.uid() = renter_id
    OR auth.uid() = host_id
  );


-- Step 7: Archive old tables (don't delete yet)
-- ============================================================================
-- Uncomment these lines after verifying migration worked correctly
-- ALTER TABLE room_slots RENAME TO room_slots_archive;
-- ALTER TABLE commitments RENAME TO commitments_archive;

-- Or create backup tables
CREATE TABLE IF NOT EXISTS room_slots_backup AS SELECT * FROM room_slots;
CREATE TABLE IF NOT EXISTS commitments_backup AS SELECT * FROM commitments;


-- Step 8: Add helpful views
-- ============================================================================
-- View for active checkouts with listing details
CREATE OR REPLACE VIEW active_checkouts AS
SELECT
  cs.*,
  l.title as listing_title,
  l.address_line1,
  l.city,
  l.state,
  p.email as user_email
FROM checkout_sessions cs
JOIN listings l ON cs.listing_id = l.id
JOIN profiles p ON cs.user_id = p.id
WHERE cs.state = 'active';

-- View for bookings with full details
CREATE OR REPLACE VIEW booking_details AS
SELECT
  b.*,
  l.title as listing_title,
  l.address_line1,
  l.city,
  l.state,
  renter.email as renter_email,
  host.email as host_email
FROM bookings b
JOIN listings l ON b.listing_id = l.id
JOIN profiles renter ON b.renter_id = renter.id
JOIN profiles host ON b.host_id = host.id;


-- ============================================================================
-- Migration Complete!
-- ============================================================================
-- Next steps:
-- 1. Verify tables were created: \dt checkout_sessions bookings
-- 2. Check constraints: \d checkout_sessions
-- 3. Test inserting a checkout session
-- 4. Verify RLS policies work correctly
-- 5. After confirming everything works, uncomment archive steps
-- ============================================================================
