-- Fix TEST20 coupon to be 20% off instead of £20 off
UPDATE coupons 
SET discount_percentage = 20, discount_amount = NULL 
WHERE code = 'TEST20';