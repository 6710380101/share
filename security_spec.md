# Firestore Security Specification

## 1. Data Invariants
- **User Roles & Privilege Escalation**: Normal users cannot promote themselves or others to `admin` or `moderator`. The user bootstrap grants `s6710380101@pkru.ac.th` administrative privileges. Profile reads allow user viewing; role mutation is strictly restricted to admins.
- **Resource Ownership**: Only authenticated members can create resources. Non-admin authors can only update or delete their own resources. The `authorId` must match the creator's `request.auth.uid` and remain immutable upon edit.
- **Moderator Power**: Moderators and Admins can update `status` (e.g., mark as `hidden` or `published`) or delete inappropriate resources.
- **Favorites**: Only the owner (`userId == request.auth.uid`) can create or delete their own favorite entry (`favorites/{userId}_{resourceId}`).
- **Reports**: Authenticated users can submit reports with their own `reporterId == request.auth.uid`. Only admins and moderators can list reports or update their resolution status.
- **Settings**: Public read access to website configuration (`settings/general`); write access strictly restricted to Admins.
- **Moderation Logs**: Only admins/moderators can view or append moderation logs.

## 2. Dirty Dozen Payloads (Rejection Targets)
1. **Self-Escalation**: Unauthenticated or normal member setting `role: "admin"` in `/users/{userId}`.
2. **Ghost Field Injection**: Adding unapproved shadow fields like `isVerified: true` or `bypassFilter: true`.
3. **Impersonated Author**: Creating a `/resources/{id}` where `authorId != request.auth.uid`.
4. **Author Mutation**: Updating a resource and changing `authorId` to another user.
5. **Junk ID Poisoning**: Using a 2KB string as document ID to waste bandwidth.
6. **Denial-of-Wallet Array**: Pushing an array with 1,000 tag items.
7. **Cross-User Favorite Deletion**: Attempting to delete another user's favorite document.
8. **Tampering Moderation Status as Non-Admin**: Setting report `status: "resolved"` as regular user.
9. **Direct Settings Overwrite**: Modifying `/settings/general` by non-admin.
10. **Unauthenticated Resource Submission**: Submitting a resource without an active user session.
11. **Negative or Spoofed Counters**: Direct client injection of negative view counts or fake stats.
12. **Bypassing Suspended Account Restrictions**: Suspended user trying to create new resources.
