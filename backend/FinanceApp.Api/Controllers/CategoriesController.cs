using FinanceApp.Api.Data;
using FinanceApp.Api.Dtos;
using FinanceApp.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinanceApp.Api.Controllers;

[Authorize]
public class CategoriesController : ApiControllerBase
{
    private readonly AppDbContext _db;

    public CategoriesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CategoryDto>>> GetAll()
    {
        var categories = await _db.Categories
            .Where(c => c.UserId == UserId)
            .OrderBy(c => c.Type).ThenBy(c => c.Name)
            .Select(c => new CategoryDto(c.Id, c.Name, c.Type, c.Color, c.Icon))
            .ToListAsync();
        return Ok(categories);
    }

    [HttpPost]
    public async Task<ActionResult<CategoryDto>> Create(CategoryInputDto dto)
    {
        var category = new Category
        {
            UserId = UserId,
            Name = dto.Name,
            Type = dto.Type,
            Color = string.IsNullOrWhiteSpace(dto.Color) ? "#64748b" : dto.Color,
            Icon = string.IsNullOrWhiteSpace(dto.Icon) ? "tag" : dto.Icon,
        };
        _db.Categories.Add(category);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = category.Id },
            new CategoryDto(category.Id, category.Name, category.Type, category.Color, category.Icon));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<CategoryDto>> Update(int id, CategoryInputDto dto)
    {
        var category = await _db.Categories.FirstOrDefaultAsync(c => c.Id == id && c.UserId == UserId);
        if (category is null) return NotFound();

        category.Name = dto.Name;
        category.Type = dto.Type;
        category.Color = string.IsNullOrWhiteSpace(dto.Color) ? category.Color : dto.Color;
        category.Icon = string.IsNullOrWhiteSpace(dto.Icon) ? category.Icon : dto.Icon;
        await _db.SaveChangesAsync();
        return Ok(new CategoryDto(category.Id, category.Name, category.Type, category.Color, category.Icon));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var category = await _db.Categories.FirstOrDefaultAsync(c => c.Id == id && c.UserId == UserId);
        if (category is null) return NotFound();

        var hasTransactions = await _db.Transactions.AnyAsync(t => t.CategoryId == id);
        if (hasTransactions)
            return Conflict(new { message = "Não é possível apagar uma categoria com transações associadas." });

        _db.Categories.Remove(category);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
