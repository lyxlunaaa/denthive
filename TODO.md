# DentHive Build Plan / Progress

## Plan (approved)
1. Create project scaffold from scratch (server + public + routes/models/controllers + middleware + config).
2. Implement MongoDB connection (Mongoose) and required collections/models: users, patients, dental_records, queues, appointments, consultations, activity_logs.
3. Implement role-based auth (JWT), password hashing (bcrypt), protected routes.
4. Implement core MVC REST API endpoints for login/register (seeded doctor/secretary), patient management, queue management, consultations, dental records.
5. Build frontend: landing page + 3 role login screens + dashboards/portals with modern white/yellow theme.
6. Implement real-time queue updates via polling (Fetch/AJAX) and toast/UX behaviors.
7. Add seed data + validation + basic error handling.
8. Add run instructions in README.md.

## Progress
- [x] Scaffold created
- [ ] Mongo connection + models
- [ ] Auth middleware + seed users
- [ ] REST API endpoints
- [ ] Frontend pages + styling
- [ ] Queue polling + notifications
- [ ] Testing & run instructions

