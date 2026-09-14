# AFISAP Teachers & Staff Quick Edit Fix

Only the Teachers & Staff Edit interaction was adjusted.

Changes:
- The existing Edit Teacher / Staff form opens without waiting for Teacher Portal credential-status retrieval.
- Credential-status retrieval now runs asynchronously after the edit form is already usable.
- The Staff ID field receives focus immediately when the edit form opens.
- The edit photo preview no longer embeds a potentially large legacy Base64 photo value; it uses the existing Drive/photo URL helper.
- No Teachers & Staff table redesign or unrelated module changes were made.
