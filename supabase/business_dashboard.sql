-- =====================================================
-- BUSINESS DASHBOARD VIEWS AND FUNCTIONS
-- Un Pique - Vistas para dashboard de negocios
-- =====================================================

-- =====================================================
-- 1. VISTA: Estadísticas de productos por negocio
-- =====================================================
CREATE OR REPLACE VIEW business_product_stats AS
SELECT 
  p.id AS product_id,
  p.business_id,
  p.name AS product_name,
  p.price,
  p.is_available,
  COUNT(DISTINCT oi.order_id) AS times_ordered,
  COALESCE(SUM(oi.quantity), 0) AS total_quantity_sold,
  COALESCE(SUM(oi.total_price), 0) AS total_revenue,
  COALESCE(AVG(oi.unit_price), 0) AS avg_price
FROM products p
LEFT JOIN order_items oi ON oi.product_id = p.id
LEFT JOIN orders o ON o.id = oi.order_id AND o.payment_status = 'approved'
GROUP BY p.id, p.business_id, p.name, p.price, p.is_available;

-- =====================================================
-- 2. VISTA: Resumen de pedidos por negocio
-- =====================================================
CREATE OR REPLACE VIEW business_order_summary AS
SELECT 
  b.id AS business_id,
  COUNT(o.id) AS total_orders,
  COUNT(CASE WHEN o.status = 'pending' THEN 1 END) AS pending_orders,
  COUNT(CASE WHEN o.status = 'preparing' THEN 1 END) AS preparing_orders,
  COUNT(CASE WHEN o.status = 'ready' THEN 1 END) AS ready_orders,
  COUNT(CASE WHEN o.status = 'in_delivery' THEN 1 END) AS in_delivery_orders,
  COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) AS delivered_orders,
  COUNT(CASE WHEN o.status = 'cancelled' THEN 1 END) AS cancelled_orders,
  COALESCE(SUM(CASE WHEN o.payment_status = 'approved' THEN o.total_amount ELSE 0 END), 0) AS total_revenue
FROM businesses b
LEFT JOIN orders o ON o.business_id = b.id
GROUP BY b.id;

-- =====================================================
-- 3. VISTA: Ventas diarias por negocio
-- =====================================================
CREATE OR REPLACE VIEW business_daily_sales AS
SELECT 
  o.business_id,
  DATE(o.created_at) AS sale_date,
  COUNT(o.id) AS order_count,
  COALESCE(SUM(CASE WHEN o.payment_status = 'approved' THEN o.total_amount ELSE 0 END), 0) AS daily_revenue,
  COALESCE(AVG(CASE WHEN o.payment_status = 'approved' THEN o.total_amount ELSE NULL END), 0) AS avg_order_value
FROM orders o
WHERE o.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY o.business_id, DATE(o.created_at)
ORDER BY sale_date DESC;

-- =====================================================
-- 4. VISTA: Horarios pico por negocio
-- =====================================================
CREATE OR REPLACE VIEW business_peak_hours AS
SELECT 
  o.business_id,
  EXTRACT(HOUR FROM o.created_at) AS hour_of_day,
  COUNT(o.id) AS order_count,
  ROUND((COUNT(o.id)::DECIMAL / SUM(COUNT(o.id)) OVER (PARTITION BY o.business_id) * 100), 2) AS percentage
FROM orders o
WHERE o.created_at >= CURRENT_DATE - INTERVAL '30 days'
  AND o.payment_status = 'approved'
GROUP BY o.business_id, EXTRACT(HOUR FROM o.created_at)
ORDER BY o.business_id, order_count DESC;

-- =====================================================
-- 5. VISTA: Ganancias netas por negocio
-- =====================================================
CREATE OR REPLACE VIEW business_net_earnings AS
SELECT 
  b.id AS business_id,
  b.name AS business_name,
  COALESCE(SUM(o.total_amount), 0) AS gross_revenue,
  COALESCE(SUM(c.commission_amount), 0) AS total_commissions,
  COALESCE(SUM(o.delivery_fee), 0) AS total_delivery_fees,
  COALESCE(SUM(c.net_amount), 0) AS net_earnings,
  COUNT(DISTINCT o.id) AS total_orders
FROM businesses b
LEFT JOIN orders o ON o.business_id = b.id AND o.payment_status = 'approved'
LEFT JOIN commissions c ON c.order_id = o.id
GROUP BY b.id, b.name;

-- =====================================================
-- 6. FUNCIÓN: Obtener ventas por período
-- =====================================================
CREATE OR REPLACE FUNCTION get_business_sales_by_period(
  p_business_id UUID,
  p_period TEXT DEFAULT 'week' -- 'day', 'week', 'month'
)
RETURNS TABLE (
  period_label TEXT,
  order_count BIGINT,
  revenue DECIMAL(10,2)
) AS $$
DECLARE
  v_interval INTERVAL;
  v_date_format TEXT;
BEGIN
  -- Determinar intervalo y formato
  CASE p_period
    WHEN 'day' THEN
      v_interval := INTERVAL '24 hours';
      v_date_format := 'HH24:00';
    WHEN 'week' THEN
      v_interval := INTERVAL '7 days';
      v_date_format := 'Dy';
    WHEN 'month' THEN
      v_interval := INTERVAL '30 days';
      v_date_format := 'DD/MM';
    ELSE
      v_interval := INTERVAL '7 days';
      v_date_format := 'Dy';
  END CASE;

  RETURN QUERY
  SELECT 
    TO_CHAR(o.created_at, v_date_format) AS period_label,
    COUNT(o.id) AS order_count,
    COALESCE(SUM(CASE WHEN o.payment_status = 'approved' THEN o.total_amount ELSE 0 END), 0)::DECIMAL(10,2) AS revenue
  FROM orders o
  WHERE o.business_id = p_business_id
    AND o.created_at >= CURRENT_TIMESTAMP - v_interval
  GROUP BY TO_CHAR(o.created_at, v_date_format)
  ORDER BY MIN(o.created_at);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. FUNCIÓN: Obtener productos más vendidos
-- =====================================================
CREATE OR REPLACE FUNCTION get_top_products(
  p_business_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  times_ordered BIGINT,
  total_quantity BIGINT,
  total_revenue DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS product_id,
    p.name AS product_name,
    COUNT(DISTINCT oi.order_id) AS times_ordered,
    COALESCE(SUM(oi.quantity), 0) AS total_quantity,
    COALESCE(SUM(oi.total_price), 0)::DECIMAL(10,2) AS total_revenue
  FROM products p
  LEFT JOIN order_items oi ON oi.product_id = p.id
  LEFT JOIN orders o ON o.id = oi.order_id AND o.payment_status = 'approved'
  WHERE p.business_id = p_business_id
  GROUP BY p.id, p.name
  ORDER BY total_quantity DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índice para búsqueda de pedidos por negocio y estado
CREATE INDEX IF NOT EXISTS idx_orders_business_status 
ON orders(business_id, status) 
WHERE status IN ('pending', 'preparing', 'ready');

-- Índice para búsqueda de pedidos recientes
CREATE INDEX IF NOT EXISTS idx_orders_business_created 
ON orders(business_id, created_at DESC);

-- Índice para estadísticas de productos
CREATE INDEX IF NOT EXISTS idx_order_items_product 
ON order_items(product_id);

-- =====================================================
-- 9. COMENTARIOS
-- =====================================================

COMMENT ON VIEW business_product_stats IS 'Estadísticas de ventas por producto para cada negocio';
COMMENT ON VIEW business_order_summary IS 'Resumen de pedidos por estado para cada negocio';
COMMENT ON VIEW business_daily_sales IS 'Ventas diarias de los últimos 30 días por negocio';
COMMENT ON VIEW business_peak_hours IS 'Horarios con mayor cantidad de pedidos por negocio';
COMMENT ON VIEW business_net_earnings IS 'Ganancias netas después de comisiones y delivery por negocio';
