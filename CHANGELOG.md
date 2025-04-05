# Changelog

All notable changes to this project will be documented in this file.

## [1.2.1] - 2023-04-05

### Added
- Weekly Orders Trend chart on dashboard showing order count by week
- Better support for paginated responses across the application

### Fixed
- Dashboard "Upcoming Deliveries" sections now work correctly with paginated API responses
- Consolidated duplicate delivery information into a single component
- Improved data processing for both array and paginated response formats
- Fixed visualization of total orders count in dashboard metrics

## [1.2.0] - 2023-04-04

### Added
- Pagination support for individual orders
- Stored procedures for efficient pagination of orders data
- "All Orders" page with complete server-side pagination

### Fixed
- SQL parameter duplication issues
- Pagination controls disappearing when changing page size
- Improved error handling in controllers and frontend components

## [1.1.0] - 2023-04-03

### Added
- Grouped orders functionality
- Filtering options for grouped orders
- Sorting for grouped orders by article, amount, etc.

### Fixed
- Hardcoded connection string issue in OrdersController 