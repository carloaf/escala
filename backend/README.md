# Escala Backend (minimal)

This is a minimal implementation to accept a PDF upload, extract table-like rows, and persist them into a local SQLite database. It's a starting point to iterate on the PDF parser and data model.

How to run locally:

1. From the project root:

```bash
cd backend
npm install
npm run start
```

2. Upload a PDF to the endpoint:

POST http://localhost:3000/api/schedules/upload
Form field: `file` (binary, PDF)

Notes:
- The parser in `src/services/pdfExtractor.service.js` is a heuristic and will require tuning for your specific PDF layout.
- Data is stored in `database/escala.sqlite` (created automatically).
