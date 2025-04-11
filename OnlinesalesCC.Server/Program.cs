using Microsoft.EntityFrameworkCore;
using OnlinesalesCC.Server.Models;
using Microsoft.AspNetCore.Authentication.Negotiate;

var builder = WebApplication.CreateBuilder(args);

// Load connection string from configuration
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
                      ?? "Server=GRW04SQLHQ01;Database=FOMdbNew;Integrated Security=True;TrustServerCertificate=True;Encrypt=False;";

// Ensure connection string has required security settings
if (!connectionString.Contains("TrustServerCertificate=True"))
{
    connectionString += ";TrustServerCertificate=True";
}
if (!connectionString.Contains("Encrypt=False"))
{
    connectionString += ";Encrypt=False";
}

// Set the configuration for FomdbNewContext
FomdbNewContext.SetConfiguration(builder.Configuration);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddDbContext<FomdbNewContext>(options =>
    options.UseSqlServer(connectionString));

// Register logging
builder.Services.AddLogging();

// Configure SMTP settings from appsettings.json
builder.Services.Configure<SmtpSettings>(builder.Configuration.GetSection("SmtpSettings"));

// Enable CORS for frontend 
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocalhost",
        builder => builder.WithOrigins("https://localhost:5010", "https://localhost:7265")
                          .AllowAnyMethod()
                          .AllowAnyHeader()
                          .AllowCredentials());
});

// Configure authentication
builder.Services.AddAuthentication(NegotiateDefaults.AuthenticationScheme)
    .AddNegotiate();

builder.Services.AddAuthorization();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseHttpsRedirection();
app.UseCors("AllowLocalhost");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

// SMTP configuration class
public class SmtpSettings
{
    public string Server { get; set; } = string.Empty;
    public int Port { get; set; } = 25;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public bool EnableSsl { get; set; } = false;
    public string FromAddress { get; set; } = string.Empty;
}
