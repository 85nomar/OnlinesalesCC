using Microsoft.EntityFrameworkCore;
using OnlinesalesCC.Server.Models;
using Microsoft.AspNetCore.Authentication.Negotiate;

var builder = WebApplication.CreateBuilder(args);

// Load connection string from configuration
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
                      ?? "Server=GRW04SQLHQ01;Database=FOMdbNew;Integrated Security=True;TrustServerCertificate=True;";

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddDbContext<FomdbNewContext>(options =>
    options.UseSqlServer(connectionString));

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
