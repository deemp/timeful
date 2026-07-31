# routes
This package contains all routes for the Timeful API.

To view the docs, visit http://localhost:3002/swagger/index.html

## How to document routes
Visit https://github.com/swaggo/swag for a comprehensive overview of the swagger comment structure

To generate Swagger docs, run the version pinned by the server module with dependency parsing:
```
go run github.com/swaggo/swag/cmd/swag@v1.16.1 init --parseDependency
```

Run the command from `server/` whenever route annotations change, then run `npm run gen:api` from
`frontend/` to refresh generated API types.
