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
