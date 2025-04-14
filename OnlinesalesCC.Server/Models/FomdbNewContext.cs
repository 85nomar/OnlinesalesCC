using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace OnlinesalesCC.Server.Models;

public partial class FomdbNewContext : DbContext
{
    private static IConfiguration _configuration;

    public FomdbNewContext()
    {
    }

    public FomdbNewContext(DbContextOptions<FomdbNewContext> options)
        : base(options)
    {
    }

    // Add a method to set the configuration
    public static void SetConfiguration(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public virtual DbSet<OrderTicket> OrderTickets { get; set; }
    public virtual DbSet<OpenOrders> OpenOrders { get; set; }
    public virtual DbSet<OpenOrdersGrouped> OpenOrdersGrouped { get; set; }
    public virtual DbSet<OrderAdditionalData> OrderAdditionalData { get; set; }
    public virtual DbSet<OrderAlternativeItem> OrderAlternativeItems { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
            string connectionString;

            if (_configuration != null)
            {
                // Get connection string from configuration
                connectionString = _configuration.GetConnectionString("DefaultConnection");

                // Ensure TrustServerCertificate is set
                if (!connectionString.Contains("TrustServerCertificate=True"))
                {
                    connectionString += ";TrustServerCertificate=True";
                }

                // Disable encryption to bypass SSL validation
                if (!connectionString.Contains("Encrypt=False"))
                {
                    connectionString += ";Encrypt=False";
                }
            }
            else
            {
                // Fallback to hardcoded connection string with SSL validation disabled
                connectionString = "Server=GRW04SQLHQ01;Database=FOMdbNew;Integrated Security=True;TrustServerCertificate=True;Encrypt=False;";
            }

            optionsBuilder.UseSqlServer(connectionString);
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<OrderTicket>(entity =>
        {
            entity.HasKey(e => e.TicketId);

            entity.ToTable("Order_Tickets");

            entity.Property(e => e.TicketId).HasColumnName("TicketID");
            entity.Property(e => e.Comment).IsUnicode(false);
            entity.Property(e => e.Entrydate).HasColumnType("datetime");
        });

        modelBuilder.Entity<OpenOrders>().HasNoKey();
        modelBuilder.Entity<OpenOrdersGrouped>().HasNoKey();

        modelBuilder.Entity<OrderAdditionalData>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.ToTable("Order_AdditionalData");
            entity.Property(e => e.ArtikelNr).IsRequired();
            entity.Property(e => e.NewDeliveryDate).IsUnicode(false);
            entity.Property(e => e.OriginalDeliveryDate).IsUnicode(false);
            entity.Property(e => e.Notes).IsUnicode(false);
        });

        modelBuilder.Entity<OrderAlternativeItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.ToTable("Order_AlternativeItems");
            entity.Property(e => e.OrderArtikelNr).IsRequired();
            entity.Property(e => e.AlternativeArtikelNr).IsRequired();
            entity.Property(e => e.AlternativeArtikel).IsRequired().IsUnicode(false);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}