# Security and privacy review

## Controls present

- Spring Security enforces server-side role checks for staff CRUD and member self-service APIs. Angular guards provide navigation UX only and do not replace those checks.
- Member signup assigns `MEMBER` on the server, normalizes email, checks duplicate email/national ID, and stores a BCrypt password hash. Members can access only the account and reservations tied to their authenticated identity.
- Public catalog reads are active-only and return a dedicated projection that excludes staff shelf and position fields.
- Login uses a short-lived signed token; secrets are externally configurable. Production profile does not use the development admin default.
- Public self-registration is disabled by default in the production profile (`MEMBER_REGISTRATION_ENABLED=false`); local and test profiles keep it enabled for development and verification.
- Error responses avoid serializing stack traces and sensitive persistence objects. Profile responses omit national ID and internal address/notes.

## Required before public launch

- Email ownership is not verified; automated account creation can claim an email address without proof. Add verified-email activation and abuse controls before opening registration publicly.
- Password reset/change, account recovery, login throttling/lockout, and registration abuse/rate limiting are not implemented.
- The schema and application have an environment-driven MySQL option, but the MySQL migrations have not been executed against the production MySQL version or provider.
- Confirm HTTPS, production CORS allow-list, strong rotating JWT secret, database least-privilege credentials, secret storage, and production log retention in the target deployment.
- Review national-ID collection, retention, consent, privacy notice, and deletion obligations for the target jurisdiction. No legal/privacy text is included as a substitute for that review.
- Review operational/public actuator exposure and ensure only health/info are reachable without authentication in the deployment.

## Verification

H2 integration tests exercise anonymous catalog reads, inactive-book hiding, role boundaries, registration validation and hashing, member ownership, and reservation cancellation ownership. This is application verification, not an external penetration test.
