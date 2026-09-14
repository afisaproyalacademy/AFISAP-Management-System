# AFISAP Teacher Portal — Announcements & Assignments Surgical Fix

Date: 12 September 2026

## Scope
Only the Teacher Portal Announcements & Assignments publishing flow was changed.

## Changes
- Subject dropdown now uses the complete official report subject list: Computing, Creative Arts, English, French, History, Mathematics, R M E, Science, TWI, Other.
- Selecting Other displays a Specify Other Subject field. The typed subject is saved as the actual subject name rather than the word Other.
- Assignment publishing remains restricted to the teacher's assigned class, but is no longer restricted to only the subject stored on the teacher staff record.
- Added AFISAP logo publishing overlay with 10% to 100% progress.
- Removed the unnecessary second full Announcements & Assignments reload after a successful publish. Once Google Sheets confirms the save, the new post is inserted into the Teacher Portal list immediately.
- Attachment upload behavior and Parent/Admin shared communication source are unchanged.

## Deployment
Code.gs changed for the subject authorization adjustment. Deploy Code.gs as a NEW VERSION of the EXISTING Apps Script Web App and keep the SAME deployment URL.
