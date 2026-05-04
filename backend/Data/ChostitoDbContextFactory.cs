using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Web_Api_Proyecto.Data;

public class ChostitoDbContextFactory : IDesignTimeDbContextFactory<ChostitoDbContext>
{
    public ChostitoDbContext CreateDbContext(string[] args)
    {
        var config = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json")
            .Build();

        var optionsBuilder = new DbContextOptionsBuilder<ChostitoDbContext>();
        optionsBuilder.UseSqlServer(config.GetConnectionString("DefaultConnection"));

        return new ChostitoDbContext(optionsBuilder.Options);
    }
}
