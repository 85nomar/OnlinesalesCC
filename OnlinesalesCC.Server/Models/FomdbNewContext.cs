using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace OnlinesalesCC.Server.Models;

public partial class FomdbNewContext : DbContext
{
    public FomdbNewContext()
    {
    }

    public FomdbNewContext(DbContextOptions<FomdbNewContext> options)
        : base(options)
    {
    }

    public virtual DbSet<OrderTicket> OrderTickets { get; set; }
    public virtual DbSet<OpenOrders> OpenOrders { get; set; }
    public virtual DbSet<OpenOrdersGrouped> OpenOrdersGrouped { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseSqlServer("Server=GRW04SQLHQ01;Database=FOMdbNew;Integrated Security=True;TrustServerCertificate=True;");

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

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
