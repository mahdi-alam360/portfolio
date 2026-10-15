# RoadFrame — Imagery Review Lab

AI-assisted personal learning project, October 2026. Synthetic illustrated road scenes; no live camera data, production customer work or vision model.

## Run the C#/ASP.NET Core backend

Install .NET 10 SDK and Node.js. From this directory:

```sh
dotnet build
dotnet run --no-build --urls http://127.0.0.1:5129
```

Open http://127.0.0.1:5129. Reviews persist in `roadframe.db`. Set `ROADFRAME_DB` to choose another database. The API is intended for trusted local use; it has no authentication and should not be exposed publicly without access control and further hardening.

```sh
node tests/integration.mjs
```

Tests start a separate local server with a temporary SQLite database and verify valid writes, invalid inputs, joins, regional aggregates, updates, parameterized injection-shaped input and persistence after restart. Set `DOTNET_EXE` if dotnet is not on PATH.

## Public interactive demo

https://mahdialam.com/roadframe/ hosts the same interface in browser-demo mode. It stores demo reviews in localStorage; it does **not** run the C# API or claim server-side SQL hosting. Its synthetic scene labels and quality scores are human annotations, not ML predictions. No external imagery or user uploads.

## API

GET `/api/cameras`, GET `/api/reviews?status=clear`, POST `/api/reviews` with `{ "cameraId":1,"status":"clear","score":80,"note":"Example" }`, GET `/api/summary`, GET `/api/health`.

SQLite includes camera and review tables, a foreign key, status/score constraints, parameterized writes and filters, an upsert, INNER JOIN review listings and LEFT JOIN/GROUP BY/AVG regional summaries. Database files and build output are excluded from Git.
