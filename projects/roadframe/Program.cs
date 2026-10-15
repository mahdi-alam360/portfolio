using Microsoft.Data.Sqlite;

SQLitePCL.Batteries_V2.Init();
var builder = WebApplication.CreateBuilder(args);
builder.WebHost.ConfigureKestrel(o => o.Limits.MaxRequestBodySize = 8192);
var dbPath = Environment.GetEnvironmentVariable("ROADFRAME_DB") ?? "roadframe.db";
builder.Services.AddSingleton(new ReviewStore(dbPath));
var app = builder.Build();
app.UseDefaultFiles();
app.UseStaticFiles();
app.MapGet("/api/health", () => Results.Ok(new { status = "ok", mode = "local-learning-prototype" }));
app.MapGet("/api/cameras", (ReviewStore store) => Results.Ok(store.Cameras()));
app.MapGet("/api/reviews", (string? status, ReviewStore store) =>
    status != null && !ReviewStore.Statuses.Contains(status)
        ? Results.BadRequest(new { error = "Unknown review status" })
        : Results.Ok(store.Reviews(status)));
app.MapPost("/api/reviews", (ReviewInput input, ReviewStore store) => {
    if (!ReviewStore.Statuses.Contains(input.Status ?? "") || input.Score is null or < 0 or > 100 || input.Note == null || input.Note.Length > 500)
        return Results.BadRequest(new { error = "Status, score 0-100 and note up to 500 characters are required" });
    if (!store.CameraExists(input.CameraId)) return Results.NotFound(new { error = "Camera not found" });
    store.Save(input);
    return Results.Ok(new { saved = true });
});
app.MapGet("/api/summary", (ReviewStore store) => Results.Ok(store.Summary()));
app.Run();

record ReviewInput(int CameraId, string? Status, int? Score, string? Note);
sealed class ReviewStore {
    public static readonly string[] Statuses = ["clear", "blurred", "occluded"];
    private readonly string connectionString;
    public ReviewStore(string path) {
        connectionString = new SqliteConnectionStringBuilder { DataSource = path, ForeignKeys = true }.ToString();
        using var db = Open();
        using var cmd = db.CreateCommand();
        cmd.CommandText = """
            CREATE TABLE IF NOT EXISTS cameras(id INTEGER PRIMARY KEY, name TEXT NOT NULL, region TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS reviews(camera_id INTEGER PRIMARY KEY REFERENCES cameras(id),
              status TEXT NOT NULL CHECK(status IN ('clear','blurred','occluded')),
              score INTEGER NOT NULL CHECK(score BETWEEN 0 AND 100), note TEXT NOT NULL, updated TEXT NOT NULL);
            INSERT OR IGNORE INTO cameras VALUES(1,'Harbour approach','Coast'),(2,'Pine overpass','North'),(3,'Market junction','Central');
            """;
        cmd.ExecuteNonQuery();
    }
    private SqliteConnection Open() { var db = new SqliteConnection(connectionString); db.Open(); return db; }
    public List<Dictionary<string, object?>> Query(string sql, string? status = null) {
        using var db = Open(); using var cmd = db.CreateCommand(); cmd.CommandText = sql;
        if (status != null) cmd.Parameters.AddWithValue("$status", status);
        using var reader = cmd.ExecuteReader(); var rows = new List<Dictionary<string, object?>>();
        while (reader.Read()) { var row = new Dictionary<string, object?>(); for(int i=0;i<reader.FieldCount;i++) row[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i); rows.Add(row); }
        return rows;
    }
    public object Cameras() => Query("SELECT id,name,region FROM cameras ORDER BY id");
    public object Reviews(string? status) => Query("SELECT c.id,c.name,c.region,r.status,r.score,r.note,r.updated FROM cameras c JOIN reviews r ON c.id=r.camera_id" + (status == null ? "" : " WHERE r.status=$status") + " ORDER BY c.id", status);
    public object Summary() => Query("SELECT c.region,COUNT(r.camera_id) AS reviewed,ROUND(AVG(r.score),1) AS averageScore FROM cameras c LEFT JOIN reviews r ON c.id=r.camera_id GROUP BY c.region ORDER BY c.region");
    public bool CameraExists(int id) {
        using var db=Open(); using var cmd=db.CreateCommand(); cmd.CommandText="SELECT COUNT(*) FROM cameras WHERE id=$id"; cmd.Parameters.AddWithValue("$id",id); return (long)cmd.ExecuteScalar()! == 1;
    }
    public void Save(ReviewInput input) {
        using var db=Open(); using var cmd=db.CreateCommand();
        cmd.CommandText="INSERT INTO reviews(camera_id,status,score,note,updated) VALUES($id,$status,$score,$note,$updated) ON CONFLICT(camera_id) DO UPDATE SET status=excluded.status,score=excluded.score,note=excluded.note,updated=excluded.updated";
        cmd.Parameters.AddWithValue("$id",input.CameraId); cmd.Parameters.AddWithValue("$status",input.Status!); cmd.Parameters.AddWithValue("$score",input.Score!); cmd.Parameters.AddWithValue("$note",input.Note!); cmd.Parameters.AddWithValue("$updated",DateTimeOffset.UtcNow.ToString("O")); cmd.ExecuteNonQuery();
    }
}
