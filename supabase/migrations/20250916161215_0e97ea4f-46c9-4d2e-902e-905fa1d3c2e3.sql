-- Phase 1: Database Schema Updates for Order Notes

-- Add order_notes column to orders table
ALTER TABLE orders ADD COLUMN order_notes TEXT;

-- Add order_notes column to package_orders table  
ALTER TABLE package_orders ADD COLUMN order_notes TEXT;