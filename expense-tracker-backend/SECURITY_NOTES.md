
Security notes:
- Passwords hashed with bcrypt (12 rounds).
- Input validated with Joi server-side.
- SQL executed with parameterized queries (mysql2) to avoid SQL injection.
- File uploads limited to JPEG/PNG and 2MB; stored in uploads/ directory.
- Password reset implemented using a signed, short-lived JWT (1 hour) so no extra DB tables are required.
