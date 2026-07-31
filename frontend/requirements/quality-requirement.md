# Quality requirements

## QR-001

Production and staging MongoDB shall disallow unauthenticated access.

- Root user + limited app user
- Authentication required
- Credentials stored in corresponding .env files

## QR-002

Dev MongoDB shall allow unauthenticated access.

## QR-003

The server shall not used as a libarary.

Thus:

- Can use an internal name prefixed with `timeful` instead of prefixed with `github.com/deemp/timeful`
