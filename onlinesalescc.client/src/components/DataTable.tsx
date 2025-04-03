import { useState, useMemo, useRef } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronsLeft, ChevronsRight, Search, ArrowUpDown } from "lucide-react";
import { useTranslation } from "react-i18next";

interface DataTableColumn<T> {
  header: string;
  accessor: keyof T | ((row: T) => any);
  cell?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  searchable?: boolean;
  searchFields?: (keyof T)[];
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
}

export default function DataTable<T>({
  data,
  columns,
  searchable = true,
  searchFields = [],
  onRowClick,
  isLoading = false,
}: DataTableProps<T>) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  
  // Reference to the table container
  const tableRef = useRef<HTMLDivElement>(null);
  
  // Helper function to scroll to top and update pagination
  const handlePageChange = (page: number, e?: React.MouseEvent) => {
    // Prevent default behavior and stop propagation
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setCurrentPage(page);
    
    // Reset scroll position of the table container
    if (tableRef.current) {
      // Find the scrollable container
      const scrollableParent = findScrollableParent(tableRef.current);
      if (scrollableParent) {
        // Use requestAnimationFrame to ensure this happens after React updates
        requestAnimationFrame(() => {
          scrollableParent.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }
    }
    
    // Prevent page from jumping by stopping window scroll
    setTimeout(() => {
      // Restore previous scroll position if body scrolled
      const currentScroll = window.scrollY;
      requestAnimationFrame(() => {
        if (window.scrollY !== currentScroll) {
          window.scrollTo(0, currentScroll);
        }
      });
    }, 50);
  };
  
  // Helper to find the closest scrollable parent element
  const findScrollableParent = (node: HTMLElement): Element | null => {
    if (!node) return document.documentElement;
    
    // Check if the node itself is scrollable
    if (node.scrollHeight > node.clientHeight) {
      return node;
    }
    
    // Find the closest ancestor that's scrollable
    let parent = node.parentElement;
    while (parent) {
      if (parent.scrollHeight > parent.clientHeight) {
        return parent;
      }
      parent = parent.parentElement;
    }
    
    // Fallback to document if no scrollable parent found
    return document.documentElement;
  };

  // Handle sorting
  const handleSort = (field: keyof T | ((row: T) => any)) => {
    // We need to store column index rather than the actual accessor function
    // for function-based accessors because functions can't be compared directly
    const columnIndex = columns.findIndex(col => col.accessor === field);
    const columnKey = `column_${columnIndex}` as keyof T;
    
    if (sortField === columnKey) {
      // Toggle direction if already sorting by this field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new sort field and default to ascending
      setSortField(columnKey);
      setSortDirection("asc");
    }
    
    // Store the actual accessor for use in sorting
    const accessor = field;
  };

  // Get cell value based on accessor (string key or function)
  const getCellValue = (row: T, accessor: keyof T | ((row: T) => any)) => {
    if (!row) {
      return null; // Return null for null/undefined rows
    }
    
    if (typeof accessor === "function") {
      try {
        return accessor(row);
      } catch (error) {
        console.error("Error accessing data with function:", error);
        return null;
      }
    }
    
    try {
      return row[accessor];
    } catch (error) {
      console.error("Error accessing property:", error);
      return null;
    }
  };

  // Filter and sort data
  const processedData = useMemo(() => {
    // First, filter based on search query if applicable
    let filteredData = [...data];
    if (searchable && searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      filteredData = data.filter(row => {
        // Check all specified search fields
        return searchFields.some(field => {
          const value = String(row[field] || "").toLowerCase();
          return value.includes(lowerCaseQuery);
        });
      });
    }

    // Then, sort if a sort field is specified
    if (sortField) {
      // Extract the column index from the sortField if it's in the format column_X
      const sortFieldStr = String(sortField);
      let columnIndexToSort = -1;
      
      if (sortFieldStr.startsWith('column_')) {
        columnIndexToSort = parseInt(sortFieldStr.replace('column_', ''), 10);
      }
      
      filteredData.sort((a, b) => {
        let aValue, bValue;
        
        if (columnIndexToSort >= 0 && columnIndexToSort < columns.length) {
          // Use the accessor from the column at the identified index
          const columnAccessor = columns[columnIndexToSort].accessor;
          aValue = getCellValue(a, columnAccessor);
          bValue = getCellValue(b, columnAccessor);
        } else {
          // Fallback to using sortField directly (for string keys)
          aValue = getCellValue(a, sortField as any);
          bValue = getCellValue(b, sortField as any);
        }
        
        // Handle comparison when either value is null or undefined
        if (aValue === null || aValue === undefined) return sortDirection === "asc" ? -1 : 1;
        if (bValue === null || bValue === undefined) return sortDirection === "asc" ? 1 : -1;

        // Handle string comparison
        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortDirection === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        // Handle number comparison
        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filteredData;
  }, [data, searchQuery, sortField, sortDirection, searchFields, searchable]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / rowsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return processedData.slice(start, start + rowsPerPage);
  }, [processedData, currentPage, rowsPerPage]);

  return (
    <div ref={tableRef} className="bg-background rounded-lg shadow-sm overflow-hidden">
      {/* Search controls */}
      {searchable && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <Input
              type="text"
              className="pl-10"
              placeholder={`${t('common.search', 'Search')}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label={t('common.searchTable', 'Search table')}
              id="table-search"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
            <TableRow>
              {columns.map((column, index) => (
                <TableHead 
                  key={index} 
                  className={`${column.sortable ? "cursor-pointer hover:text-gray-700 dark:hover:text-gray-300" : ""}`}
                  onClick={column.sortable ? () => handleSort(column.accessor as keyof T) : undefined}
                  tabIndex={column.sortable ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (column.sortable && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      handleSort(column.accessor as keyof T);
                    }
                  }}
                  role={column.sortable ? "button" : undefined}
                  aria-sort={
                    column.sortable && sortField === `column_${index}` as keyof T
                      ? (sortDirection === "asc" ? "ascending" : "descending") 
                      : undefined
                  }
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                    {column.sortable && (
                      <div className="relative w-4 h-4 ml-1">
                        {sortField === `column_${index}` as keyof T ? (
                          sortDirection === "asc" ? (
                            <div className="flex flex-col items-center">
                              <span className="text-primary">▲</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <span className="text-primary">▼</span>
                            </div>
                          )
                        ) : (
                          <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" aria-hidden="true" />
                        )}
                      </div>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-16">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground text-sm">{t('common.loading', 'Loading data...')}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-16">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Search className="h-10 w-10 text-muted-foreground opacity-40" />
                    <h3 className="font-medium text-lg">{t('common.noData', 'No data found')}</h3>
                    {searchQuery && (
                      <p className="text-muted-foreground text-sm">
                        {t('common.tryAdjustingSearch', 'Try adjusting your search or filters to find what you\'re looking for')}
                      </p>
                    )}
                    {!searchQuery && (
                      <p className="text-muted-foreground text-sm">
                        {t('common.noRecords', 'There are no records to display at this time')}
                      </p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <TableRow 
                  key={rowIndex} 
                  className={onRowClick ? "cursor-pointer hover:bg-muted dark:hover:bg-muted" : "hover:bg-muted dark:hover:bg-muted"}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onRowClick(row);
                    }
                  }}
                  role={onRowClick ? "button" : undefined}
                  aria-label={onRowClick ? `Select row ${rowIndex + 1}` : undefined}
                >
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex}>
                      {column.cell 
                        ? column.cell(getCellValue(row, column.accessor), row) 
                        : String(getCellValue(row, column.accessor) || "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls - only shown when there are more than 10 items */}
      {processedData.length > 10 ? (
        <div className="border-t border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground" id="rows-per-page-label">{t('common.itemsPerPage')}:</span>
            <Select
              value={rowsPerPage.toString()}
              onValueChange={(value) => {
                setRowsPerPage(Number(value));
                handlePageChange(1); // Reset to first page when changing page size
              }}
              aria-labelledby="rows-per-page-label"
            >
              <SelectTrigger className="w-16 h-8" aria-label="Select rows per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p 
                className="text-sm text-muted-foreground"
                aria-live="polite"
                aria-atomic="true"
              >
                {t('common.showing', 'Showing')}{" "}
                <span className="font-medium">
                  {processedData.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}
                </span>{" "}
                {t('common.to', 'to')}{" "}
                <span className="font-medium">
                  {Math.min(currentPage * rowsPerPage, processedData.length)}
                </span>{" "}
                {t('common.of', 'of')}{" "}
                <span className="font-medium">{processedData.length}</span>{" "}
                {t('common.results', 'results')}
              </p>
            </div>
            
            <div className="flex gap-1" role="navigation" aria-label="Pagination">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => handlePageChange(1, e)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
                aria-label={t('common.firstPage', 'First page')}
              >
                <ChevronsLeft className="h-4 w-4" />
                <span className="sr-only">{t('common.firstPage', 'First page')}</span>
              </Button>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, index) => {
                // Determine which page numbers to show
                let pageNum = index + 1;
                
                // If there are many pages and we're not at the start
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 2 + index;
                }
                
                // Don't show pages beyond the total
                if (pageNum > totalPages) return null;
                
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={(e) => handlePageChange(pageNum, e)}
                    className={`h-8 w-8 p-0 ${pageNum === currentPage ? "bg-primary" : ""}`}
                    aria-label={`${t('common.page', 'Page')} ${pageNum}`}
                    aria-current={pageNum === currentPage ? "page" : undefined}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => handlePageChange(totalPages, e)}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
                aria-label={t('common.lastPage', 'Last page')}
              >
                <ChevronsRight className="h-4 w-4" />
                <span className="sr-only">{t('common.lastPage', 'Last page')}</span>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-t border-border px-4 py-3">
          <p 
            className="text-sm text-muted-foreground"
            aria-live="polite"
            aria-atomic="true"
          >
            {t('common.showing', 'Showing')} <span className="font-medium">{processedData.length}</span> {t('common.results', 'results')}
          </p>
        </div>
      )}
    </div>
  );
}
