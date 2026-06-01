-- Fase 2: moedas — gastos e mais motivos de ganho

DROP POLICY IF EXISTS coin_tx_insert_own ON public.coin_transactions;

CREATE POLICY coin_tx_insert_earn ON public.coin_transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND type = 'earn'
  );

CREATE POLICY coin_tx_insert_spend ON public.coin_transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND type = 'spend'
  );
