import { supabase } from "@/integrations/supabase/client";

// Create the test order
const createTestOrder = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('create-test-order', {
      body: {
        userEmail: 'connerhillman20@gmail.com',
        packageId: 'a2a5c16e-c6aa-4261-9742-aff4fe3b602b', // 5 Meal Package
        customerName: 'Conrad Tester',
        deliveryAddress: 'Bristol, UK'
      }
    });
    
    if (error) {
      console.error('Error creating test order:', error);
    } else {
      console.log('Test order created successfully:', data);
    }
  } catch (err) {
    console.error('Function call failed:', err);
  }
};

// Call the function
createTestOrder();