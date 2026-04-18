# Product Requirements Document: Salary Slip Scanner

## 1. Overview

**Product Name:** Salary Slip Scanner
**Version:** 1.0
**Last Updated:** April 2026

Salary Slip Scanner is a single-user web application that automates the extraction, storage, and analysis of salary data from PDF payslips. Users upload payslip PDFs, which are parsed by an AI model (OpenAI gpt-4o-mini) into structured JSON, stored in MongoDB, and visualized through an analytics dashboard. The application is designed for personal salary tracking and financial awareness.

---

## 2. Problem Statement

Salary slips are dense PDF documents containing dozens of fields across earnings, taxes, deductions, and benefits. Manually tracking this data over time in spreadsheets is tedious, error-prone, and makes trend analysis difficult. There is no simple tool that lets an individual upload payslip PDFs and immediately get structured, queryable data with visual insights.

---

## 3. Goals and Objectives

| Goal | Metric |
|------|--------|
| Eliminate manual data entry from payslips | Zero manual fields -- all data extracted via AI |
| Provide structured storage of all payslip fields | 40+ fields per payslip stored in MongoDB |
| Enable salary trend analysis | Dashboard with charts covering pay, deductions, and taxes over time |
| Keep the app simple and private | Single-password auth, single-tenant, no user management overhead |

---

## 4. Target Users

- **Primary:** Individual employees who receive bi-weekly or semi-monthly PDF payslips and want to track their compensation over time.
- **Secondary:** Recruiters or hiring managers reviewing the app as a portfolio project (gated behind password with a prompt on the login screen).

---

## 5. Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.2.4 (App Router, React 19) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4, shadcn/ui (base-nova theme) |
| Font | Inter (Google Fonts) |
| Database | MongoDB Atlas via Mongoose 9 |
| AI Extraction | OpenAI API (gpt-4o-mini, JSON mode) |
| Charts | Recharts 3 |
| Auth | bcryptjs + jsonwebtoken (cookie-based JWT) |
| Icons | Lucide React |
| Toasts | Sonner |

---

## 6. Architecture

```
┌──────────────┐       ┌──────────────────┐       ┌─────────────┐
│              │       │                  │       │             │
│   Browser    │──────▶│  Next.js App     │──────▶│  MongoDB    │
│   (React)    │◀──────│  (API Routes)    │◀──────│  Atlas      │
│              │       │                  │       │             │
└──────────────┘       └────────┬─────────┘       └─────────────┘
                                │
                                │ PDF (base64)
                                ▼
                       ┌──────────────────┐
                       │  OpenAI API      │
                       │  gpt-4o-mini     │
                       │  (JSON mode)     │
                       └──────────────────┘
```

### Request Flow

1. User uploads a PDF payslip via the browser.
2. The Next.js API route receives the file, converts it to base64.
3. The base64 PDF is sent to OpenAI with a structured extraction prompt.
4. OpenAI returns a JSON object matching the payslip schema.
5. The API validates and stores the document in MongoDB.
6. The browser displays the extracted data and updates the payslip list.

---

## 7. Data Model

### 7.1 User Collection

| Field | Type | Description |
|-------|------|-------------|
| `username` | String (unique) | Always "admin" for single-user mode |
| `passwordHash` | String | bcrypt hash (12 rounds) |

### 7.2 Payslip Collection

The payslip schema captures every field found on an Intuit-format earnings statement. Fields are grouped into logical categories.

**Employee Information**

| Field | Type | Description |
|-------|------|-------------|
| `empNumber` | String | Employee number (e.g., "545393") |
| `costCenter` | String | Cost center code |
| `persNumber` | String | Personnel number |
| `employeeName` | String | Full name |
| `address` | String | Mailing address (single string) |
| `basisOfPay` | String | Pay basis (e.g., "Salary") |

**Pay Period**

| Field | Type | Description |
|-------|------|-------------|
| `periodBeginning` | Date | Start of pay period |
| `periodEnding` | Date | End of pay period |
| `checkDate` | Date | Check/deposit date (indexed, descending) |

**Earnings**

| Field | Type | Description |
|-------|------|-------------|
| `salary` | `{ rate: String, hours: Number, amount: Number, ytd: Number }` | Base salary with pay type, hours, current amount, and YTD |
| `signOnBonus` | `{ amount: Number, ytd: Number }` | One-time sign-on bonus |
| `wbfl` | `{ amount: Number, ytd: Number }` | Well-being/flexible leave pay |
| `grossPay` | `{ amount: Number, ytd: Number }` | Total gross pay |

**Tax Deductions**

| Field | Type | Description |
|-------|------|-------------|
| `federalWithholding` | `{ amount, ytd }` | Federal income tax |
| `stateWithholding` | `{ amount, ytd }` | State income tax (California) |
| `eeVoluntaryDisability` | `{ amount, ytd }` | CA SDI/VPDI |

**Additional Deductions** (all `{ amount, ytd }`)

`medical`, `dental`, `vision`, `pretax401k`, `commuterSubsidy`, `criticalIllness`, `accidentalInjury`, `hospitalCare`, `mobilityAfterTax`, `esppPurchase`, `legalInsurance`

**Employer Benefits**

| Field | Type | Description |
|-------|------|-------------|
| `match401k` | `{ amount, ytd }` | Employer 401(k) match |
| `groupTermLife` | `{ amount, ytd }` | Group term life insurance |
| `esppCurrPurchase` | Number | Current ESPP purchase amount |
| `ytdEspp` | Number | Year-to-date ESPP total |
| `hcraBox12DD` | Number | Health care reimbursement (Box 12 DD) |
| `hsaErContribution` | Number | Employer HSA contribution |

**Quota Summary**

| Field | Type | Description |
|-------|------|-------------|
| `sick` | `{ earned, used, balance }` | Sick leave accrual |

**Totals**

| Field | Type | Description |
|-------|------|-------------|
| `totalNetPay` | `{ amount, ytd }` | Net pay after all deductions |
| `totalWorkHours` | Number | Hours worked in period |
| `federalTaxableWages` | Number | Federal taxable wages |

**Payment**

| Field | Type | Description |
|-------|------|-------------|
| `paymentMethod` | String | e.g., "Direct Deposit" |
| `paymentType` | String | e.g., "Bank transfer" |
| `accountNumber` | String | Masked account number |
| `bankCheckNumber` | String | Bank routing/check number |
| `depositAmount` | Number | Amount deposited |

**Metadata**

| Field | Type | Description |
|-------|------|-------------|
| `employerName` | String | e.g., "Intuit, Inc." |
| `uploadedAt` | Date | When the slip was uploaded |
| `rawText` | String | Reserved for raw PDF text (not currently populated) |
| `createdAt` / `updatedAt` | Date | Mongoose timestamps |

---

## 8. API Surface

### 8.1 Authentication

| Endpoint | Method | Request | Response | Description |
|----------|--------|---------|----------|-------------|
| `/api/auth/login` | POST | `{ password: string }` | `{ success: true }` + Set-Cookie | Validates password against bcrypt hash in MongoDB. Seeds admin user on first call. Sets `salaryslip_auth` httpOnly JWT cookie (7-day expiry). |
| `/api/auth/logout` | POST | -- | `{ success: true }` + Clear-Cookie | Clears the auth cookie. |

### 8.2 Payslips

| Endpoint | Method | Request | Response | Description |
|----------|--------|---------|----------|-------------|
| `/api/payslips` | GET | -- | `{ payslips: Payslip[] }` | Returns all payslips sorted by checkDate descending. |
| `/api/payslips/upload` | POST | `FormData { file: PDF }` | `{ success: true, payslip: Payslip }` | Converts PDF to base64, sends to OpenAI for extraction, saves to MongoDB. Returns 409 if duplicate (same checkDate + empNumber). |
| `/api/payslips/[id]` | GET | -- | `{ payslip: Payslip }` | Returns a single payslip by MongoDB ObjectId. |
| `/api/payslips/[id]` | DELETE | -- | `{ success: true }` | Deletes a payslip. |
| `/api/payslips/insights` | GET | -- | `{ insights: InsightsData }` | Returns aggregated analytics across all payslips. |

### 8.3 Insights Response Shape

The insights endpoint computes and returns:

- `totalSlips` -- number of payslips on record
- `avgNetPay`, `avgGrossPay` -- averages across all periods
- `ytdGross`, `ytdNet`, `ytdFederalTax`, `ytdStateTax` -- from the latest payslip's YTD fields
- `netPayOverTime` -- array of `{ date, netPay, grossPay }` per period
- `totalDeductionsPerPeriod` -- array of `{ date, taxes, benefits, total }` per period
- `deductionsBreakdown` -- cumulative totals by category (Federal Tax, State Tax, 401(k), Medical, etc.)
- `earningsBreakdown` -- per-period salary and bonus (bonus computed as YTD delta to avoid double-counting one-time payments)

---

## 9. Feature Specifications

### 9.1 Authentication

**Login Page** (`/login`)
- Single password field with a lock icon
- Submit button with loading state
- Error message display for invalid credentials
- Message below the card: "If you are a recruiter or hiring manager, please reach out to me for the password."
- On success, redirects to `/upload`

**Route Protection** (`proxy.ts`)
- All routes except `/login` and `/api/auth/*` require a valid `salaryslip_auth` cookie
- Missing cookie results in redirect to `/login`
- Static assets (_next, images, favicon) are excluded from protection

**Session**
- JWT token stored in httpOnly, sameSite=lax cookie
- 7-day expiry
- Logout clears the cookie

### 9.2 Payslips Page (`/upload`)

The payslips page combines upload and listing into a single view.

**Upload Section (top)**
- Drag-and-drop zone with dashed border
- File input accepting `application/pdf`, multiple files supported
- Visual feedback: drag-active state, spinning loader during processing
- Sequential processing: files are uploaded one at a time
- Results panel showing per-file status (Extracted / Duplicate / Failed) with details
- After successful upload, the payslip table below auto-refreshes

**My Slips Section (bottom)**
- Table with columns: Check Date, Period, Hours, Gross Pay, Net Pay, Actions
- Check date displayed as badge with outline variant
- Net pay highlighted in green
- Row click navigates to detail page (`/slips/[id]`)
- Delete button per row with confirmation dialog
- Empty state with icon and message when no payslips exist
- Loading spinner during initial fetch

### 9.3 Payslip Detail Page (`/slips/[id]`)

Full breakdown of a single payslip organized into card sections:

1. **Summary Cards** -- Gross Pay, Net Pay, Hours, YTD Net (4-column grid)
2. **Employee Information** -- Name, Emp #, Pers. No, Cost Center, Basis of Pay, Employer, Address
3. **Earnings** -- Salary (with rate and hours), Sign-On Bonus, WBFL, Gross Pay (with This Period / YTD columns)
4. **Tax Deductions** -- Federal, State, EE Voluntary Disability
5. **Additional Deductions** -- Medical through Legal Insurance (11 line items)
6. **Other Benefits** -- 401(k) Match, Group Term Life, HCRA, HSA, ESPP
7. **Quota Summary** -- Sick leave (earned, used, balance)
8. **Payment Details** -- Method, Type, Account, Deposit Amount
9. **Totals** -- Federal Taxable Wages, Net Pay, YTD Net Pay

Navigation: Back arrow to return to payslips list. Delete button with confirmation.

### 9.4 Insights Dashboard (`/insights`)

Analytics dashboard with multiple visualization sections:

**Summary Cards** (4-column grid)
- Average Net Pay (green)
- Average Gross Pay
- YTD Gross
- YTD Net (green)

**Pay Over Time** (Line Chart)
- Dual lines: Gross Pay and Net Pay
- X-axis: pay period dates
- Y-axis: dollar amounts (formatted as $Xk)
- Tooltips with formatted dollar values

**Earnings Breakdown** (Bar Chart)
- Stacked/grouped bars: Salary vs Bonus
- Bonus computed as YTD delta (not raw per-period amount) to correctly show one-time payments

**Total Deductions Breakdown** (Pie/Donut Chart)
- Cumulative deductions by category
- Categories: Federal Tax, State Tax, 401(k), Medical, Dental, Vision, ESPP, Disability, Other
- Percentage labels on segments

**YTD Tax Summary**
- Federal Tax YTD, State Tax YTD, YTD Gross
- Effective Tax Rate = (Federal + State) / Gross

---

## 10. AI Extraction

### 10.1 Model Configuration

| Parameter | Value |
|-----------|-------|
| Model | `gpt-4o-mini` (configurable via `OPENAI_EXTRACTION_MODEL`) |
| Response format | `json_object` (JSON mode) |
| Temperature | 0 (deterministic) |
| Max tokens | 4096 |

### 10.2 Input

The PDF is sent as a base64-encoded file attachment using OpenAI's file content type:
```
{ type: "file", file: { filename: "payslip.pdf", file_data: "data:application/pdf;base64,..." } }
```

### 10.3 Extraction Prompt

The system prompt defines:
- Role: salary slip / earnings statement parser
- Rules for handling monetary amounts (always positive), dates (ISO 8601), and missing fields (null)
- The exact JSON schema expected in the response (40+ fields)
- Instruction to return ONLY valid JSON

### 10.4 Duplicate Detection

Before saving, the API checks for an existing payslip with the same `checkDate` and `empNumber`. If found, it returns HTTP 409 with the existing payslip data.

---

## 11. UI/UX Design

### 11.1 Layout

- **Sidebar navigation** (collapsible) with two items: Payslips, Insights
- **Header bar** with sidebar toggle, separator, and app title
- **Main content area** with 6-unit padding
- Sidebar includes app logo (dollar sign icon), app name, and sign-out button in footer

### 11.2 Design System

- shadcn/ui component library (base-nova style)
- Inter font family
- Neutral color palette with oklch color space
- Light and dark mode support via CSS custom properties
- Responsive: mobile-friendly sidebar (sheet overlay on mobile)

### 11.3 Component Library

The app uses these shadcn/ui components: Button, Input, Card, Table, Dialog, Label, Separator, Avatar, Badge, Sheet, Sidebar, Skeleton, Tooltip, Sonner (toast notifications).

---

## 12. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key for PDF extraction |
| `OPENAI_EXTRACTION_MODEL` | No | Model to use (default: `gpt-4o-mini`) |
| `MONGO_URI` | Yes | MongoDB connection string |

---

## 13. Security Considerations

| Area | Implementation |
|------|---------------|
| Password storage | bcrypt with 12 salt rounds, stored in MongoDB |
| Session | httpOnly, sameSite=lax JWT cookie, 7-day expiry |
| Route protection | Proxy-level redirect for unauthenticated requests |
| API protection | All API routes (except auth) gated by proxy cookie check |
| Sensitive data | Account numbers stored as masked values (as received from payslip) |
| Single tenant | No multi-user support; all payslips belong to one user |

---

## 14. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Build time | < 10 seconds (Turbopack) |
| PDF processing time | < 15 seconds per payslip (OpenAI API dependent) |
| Database | MongoDB Atlas (cloud-hosted, no self-hosting required) |
| Browser support | Modern browsers (Chrome, Firefox, Safari, Edge) |
| Deployment | Vercel-compatible (standard Next.js deployment) |

---

## 15. Known Limitations

1. **Single-user only** -- No multi-user support or user registration. The app assumes a single "admin" user.
2. **Payslip format** -- The extraction prompt is optimized for Intuit-format earnings statements. Other formats may require prompt adjustments.
3. **No PDF storage** -- The original PDF file is not stored; only the extracted data is persisted.
4. **No edit capability** -- Extracted data cannot be manually corrected in the UI. To fix extraction errors, delete and re-upload.
5. **No offline support** -- Requires internet for OpenAI API calls and MongoDB Atlas connectivity.

---

## 16. Future Enhancements

- Multi-employer support with different extraction prompts per employer format
- PDF storage in cloud storage (S3/GCS) for reference
- Manual field editing for extraction corrections
- Year-over-year comparison views
- Tax estimation and W-2 projection
- Export to CSV/Excel for external analysis
- Multi-user support with proper user management
- Dark mode toggle in the UI
