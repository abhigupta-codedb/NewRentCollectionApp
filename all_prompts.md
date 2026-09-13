You are working on this repository:

https://github.com/abhigupta-codedb/NewRentCollectionApp

Your task is to improve the app's Firestore scalability **without changing the existing UI/UX unnecessarily and without breaking current functionality**.

Focus specifically on these four changes:

1. **Paginate payment records**

   * Do not subscribe to or fetch the entire payments collection on initial app load.
   * Load only the most recent payments initially, for example 50 records.
   * Implement Firestore cursor-based pagination using `orderBy`, `limit`, and `startAfter`.
   * Add a reusable way to load older payments when required.
   * Preserve existing sorting and payment-related functionality.
   * Avoid offset-based pagination.

2. **Limit reminder-log loading**

   * Do not load the complete reminder history on initial app startup.
   * Fetch only the most recent 50–100 reminder records.
   * Order reminder records by timestamp/date descending.
   * If the UI provides reminder history, allow older records to be loaded on demand.
   * Use Firestore queries rather than fetching everything and filtering client-side.

3. **Load tenant-specific payment history only when needed**

   * The dashboard should not load every historical payment for every tenant.
   * When a user opens/views a specific tenant, query Firestore only for that tenant's payment history.
   * Use an indexed query similar to:
     `where("tenantId", "==", tenantId)` combined with an appropriate `orderBy`.
   * Paginate tenant payment history if the number of payments can become large.
   * Create any required Firestore composite indexes and document them.
   * Do not use client-side filtering of a globally loaded payment array.

4. **Maintain summary fields instead of repeatedly scanning payment history**

   * Avoid calculating tenant financial status by repeatedly iterating through the complete payments collection.
   * Maintain useful aggregate/summary data for each tenant, such as:

     * `totalPaid`
     * `outstandingBalance`
     * `lastPaymentDate`
     * optionally `lastPaymentAmount`
   * Update these values whenever a payment is created, edited, or deleted.
   * Use Firestore transactions or batched writes where required so payment data and summary data remain consistent.
   * Handle payment deletion/editing correctly so aggregate values do not become inaccurate.
   * Prefer a design that minimizes Firestore document reads.
   * If maintaining an aggregate safely on the client is problematic, implement the safest reasonable Firestore-compatible approach without introducing unnecessary backend infrastructure.

### Important constraints

* First inspect the current repository and understand the existing:

  * Firestore data structure
  * authentication flow
  * tenant model
  * payment model
  * reminder model
  * dashboard calculations
  * real-time listeners
* Preserve Firebase Authentication and the existing owner-based structure such as:
  `/owners/{ownerId}/...`
* Maintain existing Firestore security isolation between owners.
* Do not rewrite the entire application.
* Make targeted, minimal architectural changes.
* Keep the existing UI and workflows working unless a small UI addition such as "Load more" is necessary.
* Prefer Firestore queries over downloading documents and filtering in JavaScript.
* Remove obsolete listeners or full-collection subscriptions that become unnecessary.
* Avoid introducing Redux or another large state-management dependency unless absolutely required.
* Keep TypeScript types correct and avoid `any` where reasonable.
* Do not introduce a custom Express/Node backend solely for these changes.
* Ensure the solution works with Firebase Hosting, Cloudflare Pages, Vercel, or similar static hosting.

### Firestore cost/scalability goal

The primary objective is to make Firestore reads roughly proportional to what the user is currently viewing, instead of proportional to the total historical data accumulated by that landlord.

For example, a landlord with:

* 30 tenants
* 3,000 historical payment records
* 2,000 reminder records

should **not cause 5,000+ Firestore documents to be read every time the dashboard opens**.

Initial dashboard loading should ideally require only:

* tenant records required for the dashboard
* a small number of recent payments
* a small number of recent reminders
* summary fields already stored on tenant documents

### Implementation process

Before modifying code:

1. Inspect the repository.
2. Identify every current Firestore `onSnapshot`, `getDocs`, collection query, and client-side payment aggregation.
3. Briefly state which parts are causing unnecessary reads.
4. Then implement the four optimizations.

After implementation:

1. Run the application/build and fix TypeScript or build errors.
2. Verify:

   * adding a payment
   * editing a payment
   * deleting a payment
   * viewing a tenant
   * dashboard balances
   * recent payments
   * reminder history
   * signing in/out
3. Make sure aggregate values stay correct after create/edit/delete operations.
4. Check that existing Firestore security rules still work.
5. Add/update Firestore indexes if required.

### Deliverables

At the end, provide:

* A concise summary of files changed.
* Explanation of the previous read-heavy behaviour.
* Explanation of the new Firestore query strategy.
* Any new indexes required.
* Any Firestore security-rule changes required.
* Approximate reduction in reads for a landlord with thousands of payment/reminder records.
* Any migration required for existing tenant records that do not yet have summary fields.
* A safe migration strategy or script if existing data needs aggregates populated.

Do not make unrelated cosmetic changes or broad refactors. The objective is specifically to reduce Firestore reads and make the application scale efficiently while preserving current behaviour.

---------------------------------------------------------------------------------------------------

You are working on this repository:

https://github.com/abhigupta-codedb/NewRentCollectionApp

Review the latest `main` branch before making changes.

The application will initially be deployed as a controlled pilot for approximately 3–10 known users. Implement only the following five essential pilot-safety fixes. Do not create a readiness dashboard, redesign the application, or perform unrelated refactoring.

## 1. Remove hard-coded owner and banking information

The current default settings contain hard-coded personal and financial information, including owner name, business name, phone, email, address, PAN, bank account, IFSC and UPI details.

Required changes:

* Replace personal and financial defaults with blank or clearly non-operational values.
* A new owner must not inherit another landlord’s contact or payment information.
* It is acceptable to populate the owner name and email from the authenticated Google profile.
* Do not automatically populate phone, address, PAN, account number, IFSC, UPI ID or UPI number.
* Introduce a clear “Complete your settings” state for newly registered owners.
* Prevent reminders containing payment instructions from being generated until the necessary bank/UPI information is completed.
* Prevent a final receipt from being generated when essential landlord information required by the receipt is missing.
* Display a clear validation message directing the owner to Settings.
* Do not treat PAN as universally mandatory; validate it only where the existing receipt workflow actually requires it.

Acceptance criteria:

* A new Google user starts with blank banking and UPI fields.
* No data belonging to the current sample/default owner appears in a new account.
* The application does not produce reminders containing another person’s banking details.
* The user receives a clear message when required settings are incomplete.

## 2. Confirm Firestore payment saving before success or receipt generation

The current payment modal can close and download a receipt before the asynchronous Firestore write has succeeded.

Required changes:

* Change the payment submission flow to:

  `Submit → wait for Firestore → confirm success → generate/download receipt → close modal`

* Make the payment callback return `Promise<void>`.

* Await the callback inside the payment modal.

* Add a submitting/loading state.

* Disable repeated submission while the payment is being saved.

* If Firestore fails:

  * Keep the modal open.
  * Do not generate or download a receipt.
  * Do not show a success animation.
  * Display a clear retryable error message.

* Trigger the success animation and optional PDF download only after Firestore confirms the write.

* Ensure demo mode continues to work using the same success/error contract.

* Avoid duplicate payment creation if the user clicks multiple times.

Acceptance criteria:

* A receipt cannot be produced for a payment that failed to save.
* The modal closes only after a successful save.
* Double-clicking Submit creates only one payment.
* Failed writes show a useful error and preserve the entered form data.

## 3. Correct misleading automated-reminder behaviour

The existing batch reminder function creates reminder logs but does not actually send WhatsApp or email messages. The interface must not claim that these messages were sent.

Required changes:

* Do not describe the current batch function as automatic sending.
* For the authenticated pilot:

  * Hide or disable the batch-send button until a real delivery provider is integrated.
  * Explain briefly that individual WhatsApp/email actions open the relevant application for manual sending.
* Demo mode may retain a simulation only if it is clearly labelled “Simulation” or “Preview”.
* Remove messages claiming that batch reminders were “successfully sent”.
* Individual WhatsApp/email actions should not immediately record a reminder as `sent`.
* Because the application cannot detect whether the user completed sending in WhatsApp or their email client, record the action as `queued` or equivalent.
* Update visible status labels so that `queued` is not displayed as successfully delivered.
* Do not introduce WhatsApp Business API, SMTP, SendGrid or another paid service as part of this task.

Acceptance criteria:

* The application never claims a reminder was delivered when it only opened an external composer.
* Batch simulation is unavailable or unmistakably identified in authenticated pilot mode.
* Manual reminder logs use an accurate status.
* Existing reminder history continues to load correctly.

## 4. Restrict the pilot to approved users

Google Authentication currently allows any Google account to initialize an owner profile. Implement a secure server-enforced pilot allowlist.

Recommended Firestore structure:

```text
/pilotUsers/{email}
  enabled: true
```

The document ID may be the exact normalized email address used by Firebase Authentication.

Required changes:

* Do not implement the allowlist only through frontend environment variables or client-side JavaScript.
* Add a Firestore rules helper such as `isPilotUser()`.
* Require both:

  * The authenticated UID matches the owner path.
  * The authenticated email has an enabled pilot allowlist record.
* Client users must never be able to create, edit, list or delete allowlist records.
* An authenticated user may only check their own allowlist record.
* Perform the pilot-access check before initializing an owner profile or starting owner data subscriptions.
* If the account is not allowlisted:

  * Do not create an owner document.
  * Do not create tenants, payments or reminder collections.
  * Sign the user out or prevent entry to the app.
  * Show a friendly “This account has not been invited to the pilot” message.
* Document exactly how the administrator adds an approved email through the Firebase Console.
* Handle missing or malformed authentication email claims safely.
* Email matching must be deterministic; document whether allowlist document IDs must be lowercase.

Acceptance criteria:

* An unauthenticated user cannot access owner data.
* An authenticated but non-allowlisted user cannot create or access owner data.
* An allowlisted user can access only their own owner path.
* Allowlisted User A cannot read or write User B’s data.
* No client can modify the pilot allowlist.

## 5. Make Firestore rules and indexes reproducibly deployable and tested

The repository contains `firestore.rules` and `firestore.indexes.json`, but deployment to the exact named Firestore database must be reproducible.

The configured database ID is currently:

```text
ai-studio-rentcollectionte-16e1cfd4-fb8a-4c0f-9c7b-709974b30276
```

Required changes:

* Add or correct the Firebase CLI configuration needed to deploy:

  * Firestore security rules
  * Firestore composite indexes
* Ensure deployment targets the intended Firebase project and the exact named Firestore database rather than accidentally targeting the default database.
* Do not overwrite rules for an unrelated database.
* Document the commands required for deployment.
* Add automated Firestore Rules tests using the Firebase Emulator Suite.
* At minimum, test:

  * Unauthenticated owner read is rejected.
  * Non-allowlisted authenticated user is rejected.
  * Allowlisted owner can read/write their own valid data.
  * Cross-owner tenant access is rejected.
  * Cross-owner payment creation is rejected.
  * Cross-owner reminder access is rejected.
  * Client modification of the allowlist is rejected.
  * Invalid or oversized core fields are rejected.
* Confirm that the existing composite indexes support:

  * Tenant payments ordered by date.
  * Tenant reminders ordered by sent timestamp.
* Add concise setup documentation for:

  * Enabling Google Authentication.
  * Adding the production hosting domain to Firebase Authorized Domains.
  * Adding pilot users.
  * Running emulator tests.
  * Deploying rules and indexes.
* Do not commit service-account keys, admin credentials or `.env` secrets.

## Additional constraints

* Preserve the existing React, Vite, Firebase Authentication and Firestore architecture.
* Preserve the `/owners/{ownerId}/...` data structure.
* Do not create a custom backend unless absolutely required.
* Do not create an in-app readiness dashboard.
* Do not add paid services.
* Do not make unrelated styling or terminology changes.
* Keep TypeScript types strict and avoid `any`.
* Preserve demo mode, but clearly separate simulated behaviour from cloud functionality.
* Do not claim that Firebase configuration has been deployed unless deployment was actually performed and verified.
* Do not expose secrets in the frontend or repository.
* Keep the changes suitable for Firebase Hosting, Cloudflare Pages, Vercel and Netlify.

## Verification process

After implementation:

1. Run TypeScript checking.
2. Run the production build.
3. Run all Firestore Emulator security-rule tests.
4. Test an allowlisted Google account.
5. Test a non-allowlisted Google account.
6. Test two separate allowlisted owners for data isolation.
7. Simulate a failed Firestore payment write and confirm that no receipt is generated.
8. Confirm that a successful payment generates exactly one payment and one receipt.
9. Confirm that a new owner receives no hard-coded bank or UPI details.
10. Confirm that reminder actions no longer falsely report delivery.

## Final deliverables

Provide:

* A concise list of files changed.
* Explanation of each of the five fixes.
* Results of lint, build and emulator tests.
* Exact commands for deploying the rules and indexes.
* Exact administrator steps for adding a pilot user.
* Any Firebase Console steps still requiring manual completion.
* Any unresolved risks that should be communicated before inviting pilot users.

Do not implement additional scalability changes, document-storage migration, messaging-provider integration or a readiness dashboard in this task.
