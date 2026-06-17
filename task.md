# Tasks - File Processor Web Application

## Widescreen Light Theme Design
- `[x]` Update variables in `styles.css` to white/light theme palette
- `[x]` Adjust page container width to 98% in `styles.css`
- `[x]` Update card, console, table, and list item container styles in `styles.css` for light-mode readability
- `[x]` Verify contrast and legibility of text elements in all states
- `[x]` Walkthrough verification of the UI and report processing

## Google Sheets Copy Integration
- `[x]` Omit `PENDING_INVOICE.xlsx` and `DISCOUNT_PERCENTAGE.xlsx` files from final ZIP package
- `[x]` Implement clipboard helper function for Tab-Separated Values (TSV) copy
- `[x]` Add "Copy for Google Sheets" button on Pending and Discounts dashboard panels
- `[x]` Add copy event listeners with user alerts and success logs

## Direct Google Sheets Apps Script Sync
- `[x]` Add Apps Script Web App URL input field to left panel configuration card
- `[x]` Implement "Copy Apps Script Code" button to auto-copy webhook template
- `[x]` Save and restore script URL from browser `localStorage` automatically
- `[x]` Add "Push to Google Sheets" CTA button on the Merger output dashboard
- `[x]` Write fetch POST requester to send data payload to script url with CORS redirect support
- `[x]` Implement auto-trigger hook to push processed data immediately upon pipeline completion
