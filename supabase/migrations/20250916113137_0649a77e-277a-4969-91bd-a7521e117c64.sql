-- Update gift card products with Stripe price IDs
UPDATE public.gift_card_products 
SET stripe_price_id = CASE 
  WHEN amount = 25 THEN 'price_1S7x5SPc19yGyC87fuVYSWVE'
  WHEN amount = 50 THEN 'price_1S7x5rPc19yGyC87zA33mc7X'
  WHEN amount = 75 THEN 'price_1S7x5zPc19yGyC87gSjpqpkW'
  WHEN amount = 100 THEN 'price_1S7x67Pc19yGyC87szSSoTlZ'
  WHEN amount = 150 THEN 'price_1S7x6IPc19yGyC87Xj9YI3an'
  WHEN amount = 200 THEN 'price_1S7x6TPc19yGyC87lXCUrpom'
END
WHERE amount IN (25, 50, 75, 100, 150, 200);