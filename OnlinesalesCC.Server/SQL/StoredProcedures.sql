-- Count procedure to get total number of open orders
CREATE OR ALTER PROCEDURE [dbo].[Open_Orders_Artikel_Count]
AS
BEGIN
    SELECT COUNT(*)
    FROM Order_Header AS oh
    INNER JOIN Order_POS AS op ON oh.SALES_ORDER_NO = op.SALES_ORDER_NO
    INNER JOIN OnlineShop.dbo.WWS_ZENTRAL_ARTIKEL AS wwsza ON op.PROD_ORG_ID = wwsza.ART_NO
    WHERE NOT op.STATUS IN (
        'ORDER_COMPLETED',
        'CANCELLED',
        'RETURN_RECEIVED',
        'RETURN_CREATED',
        'SHIPPED'
    )
    AND NOT op.STATUS LIKE '%PICK%';
END
GO

-- Paginated procedure to get open orders with skip, take, and sorting
CREATE OR ALTER PROCEDURE [dbo].[Open_Orders_Artikel_Paged]
    @Skip INT,
    @PageSize INT,
    @SortColumn NVARCHAR(50),
    @SortDirection NVARCHAR(4)
AS
BEGIN
    -- Validate parameters to prevent SQL injection
    IF @SortColumn NOT IN ('BestellNr', 'Erstelldatum', 'ArtikelNr', 'Hrs', 'Artikel', 'WgrNo', 'Anzahl', 'BestellStatus')
    BEGIN
        SET @SortColumn = 'Erstelldatum';
    END

    IF @SortDirection NOT IN ('ASC', 'DESC')
    BEGIN
        SET @SortDirection = 'DESC';
    END

    -- Build dynamic SQL for sorting (safely)
    DECLARE @sql NVARCHAR(MAX);
    SET @sql = N'
    SELECT 
        oh.ORIG_SALES_ORDER_NO AS BestellNr,
        oh.CREATE_TS AS Erstelldatum,
        op.PROD_ORG_ID AS ArtikelNr,
        wwsza.HRS_TEXT AS Hrs,
        wwsza.ART_BEZ AS Artikel,
        wwsza.WGR_NO AS WgrNo,
        op.ORDERED_QTY AS Anzahl,
        op.STATUS AS BestellStatus
    FROM Order_Header AS oh
    INNER JOIN Order_POS AS op ON oh.SALES_ORDER_NO = op.SALES_ORDER_NO
    INNER JOIN OnlineShop.dbo.WWS_ZENTRAL_ARTIKEL AS wwsza ON op.PROD_ORG_ID = wwsza.ART_NO
    WHERE NOT op.STATUS IN (
        ''ORDER_COMPLETED'',
        ''CANCELLED'',
        ''RETURN_RECEIVED'',
        ''RETURN_CREATED'',
        ''SHIPPED''
    )
    AND NOT op.STATUS LIKE ''%PICK%''';

    -- Add ordering and pagination
    DECLARE @orderByClause NVARCHAR(100);
    
    -- Map column names to actual database columns
    IF @SortColumn = 'BestellNr'
        SET @orderByClause = 'oh.ORIG_SALES_ORDER_NO';
    ELSE IF @SortColumn = 'Erstelldatum'
        SET @orderByClause = 'oh.CREATE_TS';
    ELSE IF @SortColumn = 'ArtikelNr'
        SET @orderByClause = 'op.PROD_ORG_ID';
    ELSE IF @SortColumn = 'Hrs'
        SET @orderByClause = 'wwsza.HRS_TEXT';
    ELSE IF @SortColumn = 'Artikel'
        SET @orderByClause = 'wwsza.ART_BEZ';
    ELSE IF @SortColumn = 'WgrNo'
        SET @orderByClause = 'wwsza.WGR_NO';
    ELSE IF @SortColumn = 'Anzahl'
        SET @orderByClause = 'op.ORDERED_QTY';
    ELSE IF @SortColumn = 'BestellStatus'
        SET @orderByClause = 'op.STATUS';
    ELSE
        SET @orderByClause = 'oh.CREATE_TS';
    
    SET @sql = @sql + N' ORDER BY ' + @orderByClause + N' ' + @SortDirection + 
               N' OFFSET ' + CAST(@Skip AS NVARCHAR(10)) + 
               N' ROWS FETCH NEXT ' + CAST(@PageSize AS NVARCHAR(10)) + N' ROWS ONLY';
    
    -- Execute the query
    EXEC sp_executesql @sql;
END
GO

-- Procedure to get orders for a specific article number
CREATE OR ALTER PROCEDURE [dbo].[Open_Orders_By_ArtikelNr]
    @ArtikelNr INT
AS
BEGIN
    SELECT 
        oh.ORIG_SALES_ORDER_NO AS BestellNr,
        oh.CREATE_TS AS Erstelldatum,
        op.PROD_ORG_ID AS ArtikelNr,
        wwsza.HRS_TEXT AS Hrs,
        wwsza.ART_BEZ AS Artikel,
        wwsza.WGR_NO AS WgrNo,
        op.ORDERED_QTY AS Anzahl,
        op.STATUS AS BestellStatus
    FROM Order_Header AS oh
    INNER JOIN Order_POS AS op ON oh.SALES_ORDER_NO = op.SALES_ORDER_NO
    INNER JOIN OnlineShop.dbo.WWS_ZENTRAL_ARTIKEL AS wwsza ON op.PROD_ORG_ID = wwsza.ART_NO
    WHERE op.PROD_ORG_ID = @ArtikelNr
    AND NOT op.STATUS IN (
        'ORDER_COMPLETED',
        'CANCELLED',
        'RETURN_RECEIVED',
        'RETURN_CREATED',
        'SHIPPED'
    )
    AND NOT op.STATUS LIKE '%PICK%'
    ORDER BY oh.CREATE_TS DESC;
END
GO 