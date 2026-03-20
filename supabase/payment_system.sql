-- =====================================================
-- PAYMENT & MONETIZATION SYSTEM
-- Un Pique - Sistema completo de pagos, comisiones, suscripciones y publicidad
-- =====================================================

-- =====================================================
-- 1. USER ROLES (Control de acceso administrativo)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'business', 'customer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- =====================================================
-- 2. SUBSCRIPTIONS (Planes Pro)
-- =====================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE UNIQUE NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'pro')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  price DECIMAL(10,2) DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  auto_renew BOOLEAN DEFAULT true,
  mercadopago_subscription_id TEXT,
  mercadopago_preapproval_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_business ON subscriptions(business_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_expires ON subscriptions(expires_at);
CREATE INDEX idx_subscriptions_active ON subscriptions(status, expires_at) WHERE status = 'active';

-- =====================================================
-- 3. COMMISSIONS (Comisiones por venta)
-- =====================================================
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,4) NOT NULL, -- 0.09 (9%) o 0.04 (4%)
  commission_amount DECIMAL(10,2) NOT NULL,
  net_amount DECIMAL(10,2) NOT NULL, -- Lo que recibe el negocio
  platform_earnings DECIMAL(10,2) NOT NULL, -- Lo que gana Un Pique
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_commissions_order ON commissions(order_id);
CREATE INDEX idx_commissions_business ON commissions(business_id);
CREATE INDEX idx_commissions_status ON commissions(status);
CREATE INDEX idx_commissions_created ON commissions(created_at DESC);

-- =====================================================
-- 4. ADVERTISEMENTS (Sistema de publicidad)
-- =====================================================
CREATE TABLE IF NOT EXISTS advertisements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('daily', 'weekly', 'monthly')),
  price DECIMAL(10,2) NOT NULL,
  placement TEXT[] NOT NULL DEFAULT ARRAY['social_feed', 'stories', 'home_banner'],
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  mercadopago_payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ads_business ON advertisements(business_id);
CREATE INDEX idx_ads_status ON advertisements(status);
CREATE INDEX idx_ads_active ON advertisements(status, expires_at) WHERE status = 'active';
CREATE INDEX idx_ads_placement ON advertisements USING GIN(placement);

-- =====================================================
-- 5. PAYMENT TRANSACTIONS (Historial de pagos)
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  advertisement_id UUID REFERENCES advertisements(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('order', 'subscription', 'advertisement')),
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'refunded')),
  payment_method TEXT,
  mercadopago_payment_id TEXT,
  mercadopago_status TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transactions_user ON payment_transactions(user_id);
CREATE INDEX idx_transactions_business ON payment_transactions(business_id);
CREATE INDEX idx_transactions_order ON payment_transactions(order_id);
CREATE INDEX idx_transactions_type ON payment_transactions(transaction_type);
CREATE INDEX idx_transactions_status ON payment_transactions(status);

-- =====================================================
-- 6. TRIGGERS Y FUNCIONES
-- =====================================================

-- Función: Calcular comisión automáticamente cuando se confirma un pago
CREATE OR REPLACE FUNCTION calculate_commission_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_subscription RECORD;
  v_rate DECIMAL(5,4);
  v_commission DECIMAL(10,2);
  v_net DECIMAL(10,2);
BEGIN
  -- Solo si el pago fue exitoso
  IF NEW.payment_status = 'approved' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'approved') THEN
    -- Obtener el plan del negocio
    SELECT plan_type INTO v_subscription
    FROM subscriptions
    WHERE business_id = NEW.business_id
    AND status = 'active'
    LIMIT 1;
    
    -- Determinar tasa de comisión (Pro: 4%, Free: 9%)
    v_rate := CASE 
      WHEN v_subscription.plan_type = 'pro' THEN 0.04
      ELSE 0.09
    END;
    
    v_commission := NEW.total_amount * v_rate;
    v_net := NEW.total_amount - v_commission;
    
    -- Insertar registro de comisión
    INSERT INTO commissions (
      order_id,
      business_id,
      total_amount,
      commission_rate,
      commission_amount,
      net_amount,
      platform_earnings,
      status
    ) VALUES (
      NEW.id,
      NEW.business_id,
      NEW.total_amount,
      v_rate,
      v_commission,
      v_net,
      v_commission,
      'pending'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Calcular comisión al confirmar pago
DROP TRIGGER IF EXISTS on_payment_approved ON orders;
CREATE TRIGGER on_payment_approved
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION calculate_commission_on_payment();

-- Función: Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_commissions_updated_at ON commissions;
CREATE TRIGGER update_commissions_updated_at
BEFORE UPDATE ON commissions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_advertisements_updated_at ON advertisements;
CREATE TRIGGER update_advertisements_updated_at
BEFORE UPDATE ON advertisements
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas para user_roles
CREATE POLICY "Super admins can view all roles"
ON user_roles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  )
);

-- Políticas para subscriptions
CREATE POLICY "Businesses can view their own subscription"
ON subscriptions FOR SELECT
USING (
  business_id IN (
    SELECT id FROM businesses WHERE user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "Businesses can update their own subscription"
ON subscriptions FOR UPDATE
USING (
  business_id IN (
    SELECT id FROM businesses WHERE user_id = auth.uid()
  )
);

-- Políticas para commissions
CREATE POLICY "Super admins can view all commissions"
ON commissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  )
);

CREATE POLICY "Businesses can view their own commissions"
ON commissions FOR SELECT
USING (
  business_id IN (
    SELECT id FROM businesses WHERE user_id = auth.uid()
  )
);

-- Políticas para advertisements
CREATE POLICY "Anyone can view active ads"
ON advertisements FOR SELECT
USING (status = 'active');

CREATE POLICY "Businesses can view their own ads"
ON advertisements FOR SELECT
USING (
  business_id IN (
    SELECT id FROM businesses WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Businesses can insert their own ads"
ON advertisements FOR INSERT
WITH CHECK (
  business_id IN (
    SELECT id FROM businesses WHERE user_id = auth.uid()
  )
);

-- Políticas para payment_transactions
CREATE POLICY "Users can view their own transactions"
ON payment_transactions FOR SELECT
USING (
  user_id = auth.uid()
  OR
  business_id IN (
    SELECT id FROM businesses WHERE user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin')
  )
);

-- =====================================================
-- 8. VISTAS ÚTILES
-- =====================================================

-- Vista: Resumen de ingresos por negocio
CREATE OR REPLACE VIEW business_earnings AS
SELECT 
  b.id AS business_id,
  b.name AS business_name,
  s.plan_type,
  COUNT(DISTINCT o.id) AS total_orders,
  COALESCE(SUM(o.total_amount), 0) AS total_sales,
  COALESCE(SUM(c.commission_amount), 0) AS total_commissions,
  COALESCE(SUM(c.net_amount), 0) AS net_earnings
FROM businesses b
LEFT JOIN subscriptions s ON s.business_id = b.id AND s.status = 'active'
LEFT JOIN orders o ON o.business_id = b.id AND o.payment_status = 'approved'
LEFT JOIN commissions c ON c.business_id = b.id
GROUP BY b.id, b.name, s.plan_type;

-- Vista: Resumen de ingresos de la plataforma
CREATE OR REPLACE VIEW platform_earnings AS
SELECT 
  COUNT(DISTINCT c.business_id) AS total_businesses,
  COALESCE(SUM(c.platform_earnings), 0) AS commission_earnings,
  COALESCE(SUM(CASE WHEN s.plan_type = 'pro' THEN s.price ELSE 0 END), 0) AS subscription_earnings,
  COALESCE(SUM(a.price), 0) AS ad_earnings,
  COALESCE(SUM(c.platform_earnings), 0) + 
  COALESCE(SUM(CASE WHEN s.plan_type = 'pro' THEN s.price ELSE 0 END), 0) + 
  COALESCE(SUM(a.price), 0) AS total_earnings
FROM commissions c
LEFT JOIN subscriptions s ON s.status = 'active' AND s.plan_type = 'pro'
LEFT JOIN advertisements a ON a.status = 'active';

-- =====================================================
-- 9. DATOS INICIALES
-- =====================================================

-- Crear suscripción gratuita por defecto para todos los negocios existentes
INSERT INTO subscriptions (business_id, plan_type, status, price)
SELECT id, 'free', 'active', 0
FROM businesses
WHERE id NOT IN (SELECT business_id FROM subscriptions)
ON CONFLICT (business_id) DO NOTHING;

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE user_roles IS 'Roles de usuario para control de acceso administrativo';
COMMENT ON TABLE subscriptions IS 'Suscripciones de negocios (Free/Pro)';
COMMENT ON TABLE commissions IS 'Comisiones generadas por ventas (9% free, 4% pro)';
COMMENT ON TABLE advertisements IS 'Sistema de publicidad pagada';
COMMENT ON TABLE payment_transactions IS 'Historial completo de transacciones de pago';

COMMENT ON COLUMN subscriptions.plan_type IS 'Tipo de plan: free (9% comisión) o pro (4% comisión, $15,000/mes)';
COMMENT ON COLUMN commissions.commission_rate IS 'Tasa de comisión aplicada (0.09 para free, 0.04 para pro)';
COMMENT ON COLUMN advertisements.plan_type IS 'Plan de publicidad: daily ($5,000), weekly ($15,000), monthly ($30,000)';
COMMENT ON COLUMN advertisements.placement IS 'Ubicaciones de la publicidad: social_feed, stories, home_banner';

-- =====================================================
-- 10. HELPER FUNCTIONS
-- =====================================================

-- Función: Incrementar impresiones de publicidad
CREATE OR REPLACE FUNCTION increment_ad_impressions(ad_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE advertisements
  SET impressions = impressions + 1
  WHERE id = ad_id AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Función: Incrementar clicks de publicidad
CREATE OR REPLACE FUNCTION increment_ad_clicks(ad_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE advertisements
  SET clicks = clicks + 1
  WHERE id = ad_id AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Función: Obtener publicidad activa para un placement
CREATE OR REPLACE FUNCTION get_active_ads(placement_filter TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  business_id UUID,
  business_name TEXT,
  business_logo TEXT,
  plan_type TEXT,
  impressions INTEGER,
  clicks INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.business_id,
    b.name AS business_name,
    b.logo_url AS business_logo,
    a.plan_type,
    a.impressions,
    a.clicks
  FROM advertisements a
  JOIN businesses b ON b.id = a.business_id
  WHERE a.status = 'active'
    AND a.expires_at > NOW()
    AND (placement_filter IS NULL OR placement_filter = ANY(a.placement))
  ORDER BY RANDOM()
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;
