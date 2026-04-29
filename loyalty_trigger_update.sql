-- Ejecutar en el SQL Editor de Supabase
CREATE OR REPLACE FUNCTION on_claim_approved()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    
    -- Actualiza estadísticas del negocio (opcional si ya lo hacía)
    -- UPDATE businesses ...
    
    -- Inserta la transacción de puntos para el usuario
    INSERT INTO loyalty_transactions (
      user_id, amount, type, description, balance_after, business_id
    )
    VALUES (
      NEW.user_id,
      NEW.points_awarded,
      'mission_reward',
      'Recompensa por misión',
      (SELECT COALESCE(available_points, 0) + NEW.points_awarded FROM user_loyalty WHERE user_id = NEW.user_id),
      NEW.business_id
    );

    -- Actualiza el saldo en user_loyalty
    UPDATE user_loyalty
    SET available_points = available_points + NEW.points_awarded,
        total_points = total_points + NEW.points_awarded,
        total_missions_completed = total_missions_completed + 1
    WHERE user_id = NEW.user_id;

    -- Agrega notificación (NUEVO)
    INSERT INTO notifications (user_id, title, body, type, reference_id)
    VALUES (
      NEW.user_id,
      '🎉 ¡Misión aprobada!',
      'Ganaste ' || NEW.points_awarded || ' puntos por tu posteo',
      'mission_approved',
      NEW.id
    );
    
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
