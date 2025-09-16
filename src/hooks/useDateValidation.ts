import { useState, useMemo, useCallback } from "react";
import { format } from "date-fns";

export const useDateValidation = (deliveryZone: any) => {
  const [requestedDeliveryDate, setRequestedDeliveryDate] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Memoized minimum delivery date function
  const getMinDeliveryDate = useCallback(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return format(tomorrow, 'yyyy-MM-dd');
  }, []);

  // Memoized calculate production date (corrected logic)
  const calculateProductionDate = useCallback((deliveryDate: string) => {
    if (!deliveryDate) return "";
    
    const delivery = new Date(deliveryDate + 'T12:00:00');
    const leadDays = deliveryZone?.production_lead_days || 2;
    
    // Production date should be BEFORE delivery date
    const production = new Date(delivery);
    production.setDate(production.getDate() - leadDays);
    
    return format(production, 'yyyy-MM-dd');
  }, [deliveryZone?.production_lead_days]);

  // Memoized available collection dates (next 14 days)
  const getAvailableCollectionDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  }, []);

  // Memoized check if a date is available for delivery/collection
  const isDateAvailable = useCallback((date: Date) => {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    if (deliveryZone?.delivery_days) {
      return deliveryZone.delivery_days.includes(dayName);
    }
    
    // Default: Monday to Friday
    return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(dayName);
  }, [deliveryZone?.delivery_days]);

  // Memoized check if date is disabled (past dates)
  const isDateDisabled = useCallback((date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  }, []);

  // Memoized check if day is available
  const isAvailableDay = useCallback((date: Date) => {
    return !isDateDisabled(date) && isDateAvailable(date);
  }, [isDateDisabled, isDateAvailable]);

  return {
    requestedDeliveryDate,
    setRequestedDeliveryDate,
    calendarOpen,
    setCalendarOpen,
    getMinDeliveryDate,
    calculateProductionDate,
    getAvailableCollectionDates,
    isDateAvailable,
    isDateDisabled,
    isAvailableDay,
  };
};