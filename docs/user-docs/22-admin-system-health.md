# Admin — System Health — Testing Guide

## Overview
The System Health page provides real-time monitoring of all ChefLogik platform services. It polls the backend every 30 seconds and displays the status of each service with colour-coded indicators. This is a read-only operational monitoring screen used by the platform team to detect outages and degraded performance.

## Prerequisites
- Logged in to the `@admin` app (`http://localhost:5600`)
- The backend API must be running for live health data (if the API is down, the page may show a loading spinner indefinitely)

## Sub-sections

### Overall Status Banner

**Purpose**
Show a single top-level status: either "All systems operational" or "Partial degradation detected".

**How to access**
Click **System Health** in the admin sidebar. URL: `/health`.

**Test Cases**

#### Test 1: Health page loads with overall status
- **Steps**:
  1. Navigate to `/health`.
  2. The page heading reads "System Health" with subtitle "Real-time status of all platform services."
  3. Below the heading: a banner with an animated pulse dot and a status message.
- **Expected result**: 
  - When all services are operational: green banner with pulsing green dot and text "All systems operational".
  - When any service is degraded: amber banner with text "Partial degradation detected".

#### Test 2: Auto-refresh every 30 seconds
- **Steps**:
  1. Load the health page.
  2. Check the "Updated X ago" timestamp below the status message.
  3. Wait 30 seconds without interaction.
  4. Watch the timestamp.
- **Expected result**: The timestamp resets to "just now" approximately every 30 seconds as the page auto-refreshes health data.

---

### Services Table

**Purpose**
Show the status of every individual platform service.

**Test Cases**

#### Test 3: Services table shows all services
- **Steps**:
  1. On the `/health` page, scroll to the **Services** section.
  2. Each row shows: a coloured dot (green/amber/red), service name, status badge, and "last checked" timestamp.
- **Expected result**: Services are listed (examples may include: API, Database, Redis Cache, RabbitMQ, Reverb WebSocket, S3 Storage, SES Email, Twilio SMS). Each has a status:
  - **Operational** → green dot, green "Operational" badge
  - **Degraded** → amber dot, amber "Degraded" badge
  - **Outage** → red dot, red "Outage" badge
- **Edge cases to check**:
  - API itself is down → the health page may fail to load or show all services as unknown.
  - First load while health data is fetching → a spinner appears in the table area.

#### Test 4: Degraded service is highlighted
- **Precondition**: Simulate or observe a degraded service (e.g. high RabbitMQ latency).
- **Steps**:
  1. Load the health page.
  2. Look for any service with an amber or red badge.
- **Expected result**: The overall banner changes from green to amber. The specific service row shows the "Degraded" or "Outage" badge.

---

## Known Relationships
- Health status data comes from the backend `/api/platform/health` endpoint.
- Service failures here may correlate with issues visible in **Tenant Management** (e.g. tenants experiencing errors).
- Outage information should be cross-referenced with **Admin Audit Logs** for incident tracking.

## Checklist
- [ ] Health page loads at `/health`
- [ ] Overall status banner shows green when all services OK
- [ ] Overall status banner shows amber when any service is degraded
- [ ] Animated pulsing dot changes colour with status
- [ ] "Updated X ago" timestamp is visible and refreshes every 30s
- [ ] Services table lists all platform services
- [ ] Operational status shows green dot and green badge
- [ ] Degraded status shows amber dot and amber badge
- [ ] Outage status shows red dot and red badge
- [ ] Loading spinner shown before first health data arrives
