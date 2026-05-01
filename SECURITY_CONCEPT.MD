# Lyrp Security Concept

## Goal

Reduce multi-account abuse, fake reward claims, coupon exploitation, and endpoint replay fraud from roughly 10% to about 1% by moving reward decisions to the server and making abuse unprofitable.

The main principle:

```text
Browser storage = convenience
Fingerprinting = risk signal
Database ledger = source of truth
Rewards = pending until trust is earned
```

## Threat Model

Attackers may:

- create many accounts with different emails
- clear cookies, cache, localStorage, or IndexedDB
- use incognito/private browsing
- call API endpoints directly
- replay reward or redemption requests
- share coupon/reward links
- use VPNs, proxies, or datacenter IPs
- automate signup, coupon, task, and order flows

Because of this, client-side checks must never be trusted as the final authority.

## Core Strategy

Lyrp should use a layered anti-fraud system:

1. Server-side reward eligibility ledger
2. One-time redemption tokens
3. Device and browser risk signals
4. IP and velocity limits
5. Pending rewards for untrusted users
6. Admin fraud review tools

No single layer is enough. The system should combine these signals into a risk score and decide whether to allow, delay, reduce, or block rewards.

## Device Identity

On first visit or signup, the client can generate a random device ID and store it in:

- HttpOnly Secure cookie, preferred for server-managed identity
- localStorage or IndexedDB, as a weak backup signal

The server should also collect low-risk device signals such as:

- user agent
- browser language
- timezone
- platform
- screen size
- IP hash
- signup/login velocity

These values should be hashed or normalized where possible. They should be used for risk scoring, not as a guaranteed identity.

Important: users can clear browser storage. The server must remember reward claims by account, device cluster, IP cluster, and campaign.

## Server-Side Reward Ledger

Every reward source should be tracked in the database.

Examples:

- signup bonus
- coupon redemption
- daily task
- Instagram follow reward
- referral reward
- campaign reward
- admin grant

The system should know:

- which user claimed the reward
- which device or device cluster claimed it
- which IP or IP cluster claimed it
- which campaign it belongs to
- whether the reward is pending, usable, blocked, or reversed
- when it was created and claimed

This prevents abuse where users clear cache or call endpoints directly.

## One-Time Redemption URLs

One-time redemption URLs should be used for coupons, promotions, referrals, task completion links, and any flow where a reward could otherwise be replayed.

Example:

```text
https://lyrp.io/redeem/r_8f4b7c9e2a1...
```

The token must be random and unguessable. Do not generate tokens from user IDs, emails, timestamps, or predictable hashes.

Recommended token properties:

- 128 to 256 bits of randomness
- short expiration
- stored hashed in the database
- single-use by default
- optionally bound to a specific user for high-value rewards

The database should store:

```text
token_hash
campaign_id
reward_amount
created_at
expires_at
redeemed_at
redeemed_by_user_id
redeemed_ip_hash
redeemed_device_hash
status
```

## Atomic Redemption

Redemption must happen atomically in the database so parallel requests cannot claim the same token twice.

Example pattern:

```sql
UPDATE redemption_tokens
SET redeemed_at = NOW(),
    redeemed_by_user_id = $1,
    redeemed_ip_hash = $2,
    redeemed_device_hash = $3
WHERE token_hash = $4
  AND redeemed_at IS NULL
  AND expires_at > NOW()
RETURNING id, campaign_id, reward_amount;
```

If no row is returned, the token is invalid, expired, or already redeemed.

After the token is marked redeemed, the server should still check:

- user is logged in
- account is not banned or frozen
- campaign is active
- user has not already claimed this campaign
- related device/IP cluster has not already claimed this campaign
- risk score is below the allowed threshold

## Campaign Limits

A token being valid should not automatically mean the user gets the reward.

Each campaign should define limits such as:

- max claims per user
- max claims per device cluster
- max claims per IP cluster
- max claims per day
- max global claims
- minimum account age
- email verification required
- Instagram follow required
- risk score maximum

This prevents a user from creating many accounts and redeeming many different valid tokens.

## Pending Rewards

High-risk or new-account rewards should be pending before they become usable.

Examples:

- signup bonus is pending until email verification and Instagram follow are complete
- coupon reward is pending for new or risky accounts
- daily task rewards are blocked if the device/IP cluster already claimed today
- order creation can only use usable coins, not pending coins

Recommended coin states:

```text
pending
usable
blocked
reversed
```

This makes abuse less profitable because attackers cannot instantly convert fake accounts into orders.

## Risk Score

Each signup, login, redemption, task completion, and order should receive a risk score.

Example risk factors:

- same device created multiple accounts
- same IP created many accounts recently
- disposable email domain
- VPN, proxy, or datacenter IP
- repeated redemption attempts
- very fast signup-to-order timing
- same target URL used by related accounts
- coupon used by related accounts
- timezone/language/IP mismatch
- failed login or redemption bursts

Example actions:

```text
0-30: allow normally
31-60: allow account, hold rewards as pending
61-80: block rewards and require review
81-100: block action or freeze account
```

## Endpoint Security

Assume attackers know every endpoint.

Do not rely on hidden frontend routes or secret client logic. Every sensitive endpoint must enforce server-side rules.

Important endpoints:

```text
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/complete-follow
POST /api/coins/redeem
POST /api/orders
POST /api/redeem/:token
```

Each sensitive endpoint should check:

- authentication
- rate limits
- account status
- device/IP cluster
- reward eligibility
- campaign limits
- risk score
- idempotency or one-time use

## Rate Limits

Recommended limits:

- signup attempts per IP per hour
- signup attempts per device per day
- coupon redemptions per account/device/IP
- redemption attempts per token/IP
- order creation per account/device/IP
- failed login attempts per account/IP

High-risk endpoints should return generic errors so attackers cannot easily learn which signal triggered a block.

## Admin Fraud Dashboard

Admins should be able to inspect and act on abuse.

Useful admin fields:

- risk score
- linked accounts
- shared device cluster
- shared IP cluster
- signup source
- coin sources
- pending/usable/blocked coins
- coupon usage
- redemption attempts
- order targets
- account age

Useful admin actions:

- freeze account
- unfreeze account
- block rewards
- reverse pending coins
- mark device/IP cluster as suspicious
- approve pending rewards

## Recommended Database Tables

Possible tables:

```text
lyrp_device_identities
lyrp_user_devices
lyrp_reward_ledger
lyrp_redemption_tokens
lyrp_campaigns
lyrp_risk_events
lyrp_account_flags
```

The existing `lyrp_coin_transactions` table can remain, but should become part of a stricter ledger model that tracks reward status and source eligibility.

## Implementation Priority

Recommended order:

1. Add reward ledger with pending/usable coin states.
2. Stop making signup coins instantly usable.
3. Add one-time redemption tokens with atomic redemption.
4. Add campaign-level user/device/IP claim limits.
5. Add device identity cookie and basic fingerprint signals.
6. Add rate limits to signup, login, redemption, and order endpoints.
7. Add risk scoring.
8. Add admin fraud dashboard.

## Expected Impact

The highest-impact change is to stop giving instantly usable coins to every new account.

Expected fraud reduction comes from combining:

- signup bonus lock
- one-time tokens
- device/IP clustering
- campaign limits
- velocity limits
- pending rewards
- admin review

Fingerprinting alone will not reduce fraud from 10% to 1%. A server-side reward ledger with one-time tokens and risk-based reward eligibility is the stronger approach.
