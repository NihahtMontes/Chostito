using Microsoft.EntityFrameworkCore;
using Web_Api_Proyecto.Models;

namespace Web_Api_Proyecto.Data;

public class ChostitoDbContext : DbContext
{
    public ChostitoDbContext(DbContextOptions<ChostitoDbContext> options) : base(options) { }

    public DbSet<Usuario> Usuarios { get; set; }
    public DbSet<Categoria> Categorias { get; set; }
    public DbSet<Lugar> Lugares { get; set; }
    public DbSet<Evento> Eventos { get; set; }
    public DbSet<Reserva> Reservas { get; set; }
    public DbSet<Entrada> Entradas { get; set; }
    public DbSet<Pago> Pagos { get; set; }
    public DbSet<Favorito> Favoritos { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.Nombre).IsRequired().HasMaxLength(100);
            entity.Property(u => u.Email).IsRequired().HasMaxLength(150);
            entity.Property(u => u.PasswordHash).IsRequired();
            entity.Property(u => u.Rol).IsRequired().HasMaxLength(20);
        });

        modelBuilder.Entity<Categoria>(entity =>
        {
            entity.Property(c => c.Nombre).IsRequired().HasMaxLength(50);
        });

        modelBuilder.Entity<Lugar>(entity =>
        {
            entity.Property(l => l.Nombre).IsRequired().HasMaxLength(100);
            entity.Property(l => l.Pais).IsRequired().HasMaxLength(50);
            entity.Property(l => l.Ciudad).IsRequired().HasMaxLength(50);
            entity.Property(l => l.Ambiente).IsRequired().HasMaxLength(50);
        });

        modelBuilder.Entity<Evento>(entity =>
        {
            entity.Property(e => e.Titulo).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Eslogan).HasMaxLength(300);
            entity.Property(e => e.Estado).IsRequired().HasMaxLength(20);

            entity.HasOne(e => e.Categoria)
                .WithMany(c => c.Eventos)
                .HasForeignKey(e => e.IdCategoria)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Organizador)
                .WithMany(u => u.EventosOrganizados)
                .HasForeignKey(e => e.IdOrganizador)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Lugar)
                .WithMany(l => l.Eventos)
                .HasForeignKey(e => e.IdLugar)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Reserva>(entity =>
        {
            entity.Property(r => r.Estado).IsRequired().HasMaxLength(20);
            entity.Property(r => r.Total).HasPrecision(10, 2);

            entity.HasOne(r => r.Usuario)
                .WithMany(u => u.Reservas)
                .HasForeignKey(r => r.IdUsuario)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Entrada>(entity =>
        {
            entity.Property(e => e.Tipo).IsRequired().HasMaxLength(30);
            entity.Property(e => e.Precio).HasPrecision(10, 2);
            entity.Property(e => e.CodigoQR).IsRequired().HasMaxLength(36);
            entity.Property(e => e.Estado).IsRequired().HasMaxLength(20);

            entity.HasOne(e => e.Reserva)
                .WithMany(r => r.Entradas)
                .HasForeignKey(e => e.IdReserva)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Evento)
                .WithMany(ev => ev.Entradas)
                .HasForeignKey(e => e.IdEvento)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Pago>(entity =>
        {
            entity.Property(p => p.Monto).HasPrecision(10, 2);
            entity.Property(p => p.Estado).IsRequired().HasMaxLength(20);
            entity.Property(p => p.MetodoPago).IsRequired().HasMaxLength(30);
            entity.Property(p => p.CodigoTransaccion).IsRequired().HasMaxLength(36);

            entity.HasOne(p => p.Reserva)
                .WithOne(r => r.Pago)
                .HasForeignKey<Pago>(p => p.IdReserva)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Favorito>(entity =>
        {
            entity.HasOne(f => f.Usuario)
                .WithMany(u => u.Favoritos)
                .HasForeignKey(f => f.IdUsuario)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(f => f.Evento)
                .WithMany(e => e.Favoritos)
                .HasForeignKey(f => f.IdEvento)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(f => new { f.IdUsuario, f.IdEvento }).IsUnique();
        });
    }
}
