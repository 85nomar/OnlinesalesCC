using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace OnlinesalesCC.Server.Models;

public class FomdbNewContext : DbContext
{
    public FomdbNewContext(DbContextOptions<FomdbNewContext> options)
        : base(options)
    {
    }

    public DbSet<OrderTicket> OrderTickets { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<OrderTicket>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity.ToTable("OrderTickets");

            entity.Property(e => e.Id)
                .IsRequired();

            entity.Property(e => e.TicketId)
                .IsRequired();

            entity.Property(e => e.ArtikelNr)
                .IsRequired();

            entity.Property(e => e.BestellNr)
                .IsRequired();

            entity.Property(e => e.Comment)
                .IsRequired();

            entity.Property(e => e.ByUser)
                .IsRequired();

            entity.Property(e => e.Entrydate)
                .IsRequired();

            // Create an index on TicketId for faster lookups
            entity.HasIndex(e => e.TicketId)
                .IsUnique();

            // Create an index on ArtikelNr for faster lookups
            entity.HasIndex(e => e.ArtikelNr);

            // Create an index on BestellNr for faster lookups
            entity.HasIndex(e => e.BestellNr);
        });
    }
}
