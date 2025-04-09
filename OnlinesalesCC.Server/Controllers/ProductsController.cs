using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnlinesalesCC.Server.Models;

namespace OnlinesalesCC.Server.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        [HttpGet]
        public IEnumerable<OpenOrdersGrouped> Get()
        {
            IEnumerable<OpenOrdersGrouped> retOpenOrdersGrouped;

            using (var context = new FomdbNewContext())
            {
                retOpenOrdersGrouped = context.OpenOrdersGrouped.FromSql($"execute Open_Orders_GroupedArtikel");
            }

            return retOpenOrdersGrouped;
        }
    }
}