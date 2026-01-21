import { useState, useMemo, useCallback } from "react";
import { format } from "date-fns";

interface DateValidationConfig {
  deliveryZone: any;
  deliveryMethod: "delivery" | "pickup";
  collectionPoints: any[];
  selectedCollectionPoint: string;
}

export const useDateValidation = (config: DateValidationConfig) => {
  const { deliveryZone, deliveryMethod, collectionPoints, selectedCollectionPoint } = config;
  
  const [requestedDeliveryDate, setRequestedDeliveryDate] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Get the selected collection point object
  const activeCollectionPoint = useMemo(() => {
    if (deliveryMethod !== "pickup" || !selectedCollectionPoint) return null;
    return collectionPoints.find(cp => cp.id === selectedCollectionPoint);
  }, [deliveryMethod, selectedCollectionPoint, collectionPoints]);

  // Get available days based on delivery method
  const availableDays = useMemo(() => {
    if (deliveryMethod === "pickup" && activeCollectionPoint?.collection_days) {
      // Use collection point's days
      return activeCollectionPoint.collection_days.map((d: string) => d.toLowerCase());
    }
    
    if (deliveryMethod === "delivery" && deliveryZone?.delivery_days) {
      // Use delivery zone's days
      return deliveryZone.delivery_days.map((d: string) => d.toLowerCase());
    }
    
    // Default fallback: no days available until zone/point is selected
    return [];
  }, [deliveryMethod, activeCollectionPoint, deliveryZone]);

  // Memoized minimum delivery date function
  const getMinDeliveryDate = useCallback(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return format(tomorrow, 'yyyy-MM-dd');
  }, []);

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
    return availableDays.includes(dayName);
  }, [availableDays]);

  // Memoized check if date is disabled (past dates or today)
  const isDateDisabled = useCallback((date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate <= today;
  }, []);

  // Memoized check if day is available (not disabled AND available)
  const isAvailableDay = useCallback((date: Date) => {
    return !isDateDisabled(date) && isDateAvailable(date);
  }, [isDateDisabled, isDateAvailable]);

  // Clear selected date when delivery method or zone/point changes
  // This prevents selecting an invalid date
  const resetDate = useCallback(() => {
    setRequestedDeliveryDate("");
  }, []);

  return {
    requestedDeliveryDate,
    setRequestedDeliveryDate,
    calendarOpen,
    setCalendarOpen,
    getMinDeliveryDate,
    getAvailableCollectionDates,
    isDateAvailable,
    isDateDisabled,
    isAvailableDay,
    availableDays,
    resetDate,
  };
};
