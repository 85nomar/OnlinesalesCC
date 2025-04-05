using System;
using System.Collections.Generic;

namespace OnlinesalesCC.Server.Models
{
  /// <summary>
  /// Standard pagination request parameters
  /// </summary>
  public class PaginationRequest
  {
    private int _page = 1;
    private int _pageSize = 20;
    private const int MaxPageSize = 100;

    /// <summary>
    /// Current page number (1-based)
    /// </summary>
    public int Page
    {
      get => _page;
      set => _page = value < 1 ? 1 : value;
    }

    /// <summary>
    /// Number of items per page (default: 20, max: 100)
    /// </summary>
    public int PageSize
    {
      get => _pageSize;
      set => _pageSize = value > MaxPageSize ? MaxPageSize : (value < 1 ? 20 : value);
    }

    /// <summary>
    /// Calculate the number of items to skip
    /// </summary>
    public int Skip => (Page - 1) * PageSize;

    /// <summary>
    /// Property to sort by (optional)
    /// </summary>
    public string? SortBy { get; set; }

    /// <summary>
    /// Sort direction (asc or desc, default: asc)
    /// </summary>
    public string SortDirection { get; set; } = "asc";
  }

  /// <summary>
  /// Standard pagination response wrapper for any data type
  /// </summary>
  /// <typeparam name="T">Type of data being paginated</typeparam>
  public class PaginatedResponse<T>
  {
    /// <summary>
    /// Items for the current page
    /// </summary>
    public List<T> Items { get; set; } = new List<T>();

    /// <summary>
    /// Total number of items across all pages
    /// </summary>
    public int TotalCount { get; set; }

    /// <summary>
    /// Total number of pages
    /// </summary>
    public int PageCount { get; set; }

    /// <summary>
    /// Current page number
    /// </summary>
    public int CurrentPage { get; set; }

    /// <summary>
    /// Number of items per page
    /// </summary>
    public int PageSize { get; set; }

    /// <summary>
    /// Whether there is a previous page
    /// </summary>
    public bool HasPreviousPage => CurrentPage > 1;

    /// <summary>
    /// Whether there is a next page
    /// </summary>
    public bool HasNextPage => CurrentPage < PageCount;

    /// <summary>
    /// Create a new paginated response
    /// </summary>
    public PaginatedResponse() { }

    /// <summary>
    /// Create a new paginated response with the given parameters
    /// </summary>
    public PaginatedResponse(List<T> items, int totalCount, int currentPage, int pageSize)
    {
      Items = items;
      TotalCount = totalCount;
      CurrentPage = currentPage;
      PageSize = pageSize;
      PageCount = pageSize > 0 ? (int)Math.Ceiling(totalCount / (double)pageSize) : 0;
    }
  }
}