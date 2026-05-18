# DentHive (localhost scaffold)

## Tech Stack
- Backend: Node.js + Express.js
- Database: MongoDB (Mongoose ODM only)
- Frontend: HTML/CSS/Vanilla JS
- Architecture: MVC-ish folder structure (controllers/routes/services)

## Run (local)
1. Install MongoDB and ensure it runs on `mongodb://127.0.0.1:27017`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start server:
   ```bash
   npm run dev
   ```
4. Open:
   - Landing: http://localhost:3000/
   - Doctor: http://localhost:3000/doctor-login.html
   - Secretary: http://localhost:3000/secretary-login.html
   - Patient: http://localhost:3000/patient-login.html

## Seed Credentials (first run)
- Doctor: `doctor1` / `Doctor123!`
- Secretary: `secretary1` / `Secretary123!`

## Notes
This is an initial working scaffold (auth + Mongo models + basic dashboard placeholders + queue polling).
Next steps: full patient registration UI, complete doctor clinical workflow, appointment scheduler, and improved patient queue ETA.

