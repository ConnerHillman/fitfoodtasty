// Test script to create order - you can run this in the browser console
const createTestOrder = async () => {
  const { supabase } = await import('./src/integrations/supabase/client.js');
  
  const { data, error } = await supabase.functions.invoke('create-test-order', {
    body: {
      userEmail: 'connerhillman20@gmail.com',
      packageId: 'a2a5c16e-c6aa-4261-9742-aff4fe3b602b', // 5 Meal Package
      customerName: 'Conner Hillman',
      deliveryAddress: 'Bristol, UK'
    }
  });
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Order created successfully:', data);
  }
};

createTestOrder();