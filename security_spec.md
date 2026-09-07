# Security Specification: Multi-Tenant Property Owner Rent Tracking

## 1. Data Invariants
- An Owner document `/owners/{ownerId}` can only be read, created, or updated by the authenticated owner (`request.auth.uid == ownerId`).
- Tenants `/owners/{ownerId}/tenants/{tenantId}` belong exclusively to the parent owner (`request.auth.uid == ownerId`). No other user can read, list, create, edit, or delete them.
- Payments `/owners/{ownerId}/payments/{paymentId}` and Reminders `/owners/{ownerId}/reminders/{reminderId}` must strictly belong to the owner, with immutable `ownerId` and valid references.
- Document IDs must conform to `isValidId()` (<= 128 chars, alphanumeric + dash/underscore).
- PII (phone, email, bank details) are shielded under `/owners/{ownerId}` sub-trees accessible strictly to the authenticated owner.

## 2. The "Dirty Dozen" Payloads
1. **Unauthenticated List Tenants**: An unauthenticated user attempts `list` on `/owners/owner123/tenants`. -> Rejected.
2. **Cross-Tenant Snooping**: User B (`uid: user_456`) attempts `get` on `/owners/user_123/tenants/tenant_01`. -> Rejected.
3. **Cross-Tenant Payment Inject**: User B attempts `create` on `/owners/user_123/payments/pay_99`. -> Rejected.
4. **Owner ID Spoofing on Tenant**: User A attempts to write a tenant with `ownerId: "someone_else"`. -> Rejected.
5. **Oversized String / Denial of Wallet**: Tenant name with 50,000 characters. -> Rejected.
6. **Path Traversal / ID Poisoning**: Document ID with invalid characters `../../admin`. -> Rejected.
7. **Negative Rent Injection**: Creating a tenant with negative rent amount. -> Rejected.
8. **Shadow Field Injection**: Attempting to inject administrative fields (`role: 'superadmin'`) on owner document. -> Rejected.
9. **Unauthenticated Owner Read**: Anonymous query to read owner bank details. -> Rejected.
10. **Delete Other Owner's Tenant**: User B attempts to delete `/owners/user_123/tenants/tenant_01`. -> Rejected.
11. **Update Other Owner's Settings**: User B attempts to overwrite `/owners/user_123`. -> Rejected.
12. **Cross-Owner Reminder Log Read**: User B attempts to query `/owners/user_123/reminders`. -> Rejected.
