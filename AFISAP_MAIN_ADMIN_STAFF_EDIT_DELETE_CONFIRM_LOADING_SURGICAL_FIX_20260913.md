# AFISAP Main Admin — Teachers & Staff Edit/Delete Surgical Fix

Main Admin only:
- Fixed Edit action to resolve records by permanent Staff ID as well as older local record ID.
- Edit now asks: "Do you want to edit this staff?"
- After confirmation, the AFISAP loading indicator appears briefly before the edit form opens.
- Delete now asks: "Do you want to delete this staff?"
- After confirmation, the AFISAP deleting loader appears.
- Staff deletion is sent to the official Teachers Google Sheet first.
- The Main Admin list is changed only after Google Sheets confirms deletion.
- Teacher Portal files were verified unchanged.
- No Code.gs change is required for this frontend routing/confirmation correction.
