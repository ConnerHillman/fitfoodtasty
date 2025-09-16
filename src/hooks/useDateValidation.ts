import { useState } from "react";

export const useDateValidation = (deliveryZone: any) => {
  const [requestedDeliveryDate, setRequestedDeliveryDate] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Calculate minimum delivery date (tomorrow)
  const getMinDeliveryDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Calculate production date (corrected logic)
  const calculateProductionDate = (deliveryDate: string) => {
    if (!deliveryDate) return "";
    
    const delivery = new Date(deliveryDate + 'T12:00:00');
    const leadDays = deliveryZone?.production_lead_days || 2;
    
    // Production date should be BEFORE delivery date
    const production = new Date(delivery);
    production.setDate(production.getDate() - leadDays);
    
    return production.toISOString().split('T')[0];
  };

  // Get available collection dates (next 14 days)
  const getAvailableCollectionDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  // Check if a date is available for delivery/collection
  const isDateAvailable = (date: Date) => {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    if (deliveryZone?.delivery_days) {
      return deliveryZone.delivery_days.includes(dayName);
    }
    
    // Default: Monday to Friday
    return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(dayName);
  };

  // Check if date is disabled (past dates)
  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Check if day is available
  const isAvailableDay = (date: Date) => {
    return !isDateDisabled(date) && isDateAvailable(date);
  };

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