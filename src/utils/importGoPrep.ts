// Script to import GoPrep menu data
import { supabase } from '@/integrations/supabase/client';

const menuData = `Status	Title	Price	Added
Inactive	10" Cheesecake (12-14 Portions)	£40.00	07/15/2024
Inactive	6" Cheesecake (6-8 Portions)	£20.00	07/15/2024
Inactive	8" Cheesecake (8-10 Portions)	£30.00	07/15/2024
Inactive	Alice Springs Chicken	£9.00	04/23/2025
Inactive	Alice Springs Chicken (Trojan)	£9.00	04/25/2025
Inactive	Bang Bang Beef Bowl	£9.00	10/22/2024
Inactive	Bang Bang Beef Bowl - 250g Carbs	£0.00	02/14/2025
Active	Bang Bang Chicken	£9.00	02/22/2022
Inactive	Bang Bang Chicken  (Trojan)	£8.50	03/02/2024
Active	Bang Bang Chicken (BIG)	£12.00	04/14/2025
Active	Bang Bang Chicken (LowCal)	£7.50	07/12/2022
Inactive	Bang Bang Rice Bowl	£8.50	05/08/2024
Inactive	Bang Bang Rice Bowl (Trojan)	£6.50	05/24/2024
Inactive	BBQ Chicken Bowl	£8.50	01/31/2024
Inactive	BBQ Chicken Skewers with Rice & Veg	£8.00	01/19/2021
Inactive	BBQ Pulled Chicken Macaroni & Cheese	£8.00	12/27/2023
Inactive	BBQ Pulled Chicken Macaroni & Cheese (LowCal)	£6.50	01/01/2024
Inactive	Beef Enchiladas	£9.00	06/14/2023
Inactive	Beef Enchiladas - 250g Carbs	£8.50	01/24/2025
Inactive	Beef Enchiladas (Trojan)	£8.50	06/23/2024
Active	Beef Jalfrezi and Pilau Rice	£9.00	08/13/2025
Inactive	Beef Jalfrezi and Pilau Rice (Trojan)	£9.00	09/05/2025
Inactive	Beef Mince , Rice & Broccoli	£10.00	04/25/2025
Inactive	Beef Mince in Tomato Sauce & Spaghetti - Extra Protein & 250g Carbs	£0.00	04/04/2025
Inactive	Beef, Broccoli & Rice	£8.00	03/20/2024
Inactive	Beefy Breakfast Burrito	£8.00	10/09/2024
Inactive	Beefy Breakfast Burrito - 250g Carbs	£8.00	01/24/2025
Inactive	Beefy Breakfast Burrito (LowCal)	£6.50	10/21/2024
Inactive	Big Chicken Pesto Pasta	£12.00	04/14/2025
Inactive	Big Pepperoni Pizza Bowl	£12.00	04/09/2025
Inactive	Big Red Thai Chicken Noodles	£12.00	04/14/2025
Inactive	Big Tandoori Chicken & Pilau Rice	£12.00	04/14/2025
Inactive	Biscoff Overnight Oats	£5.50	10/31/2023
Inactive	Breakfast Frittata	£7.50	04/12/2023
Inactive	Breakfast Hash	£8.50	02/10/2025
Inactive	Buffalo Chicken	£8.50	06/22/2024
Inactive	Buffalo Chicken (LowCal)	£6.50	09/01/2024
Active	Buffalo Chicken Bowl	£9.00	01/29/2025
Inactive	Buffalo Chicken Bowl - With Rice (Trojan)	£9.00	06/07/2025
Active	Buffalo Chicken Bowl (BIG)	£12.00	04/14/2025
Active	Buffalo Chicken Bowl (LowCal)	£7.50	01/29/2025
Inactive	Butcher's Bangers & Mash	£8.00	09/26/2022
Active	Cajun Chicken Breast w/ Roasted New Potatoes (BIG)	£12.00	04/14/2025
Inactive	Cajun Chicken Pasta	£8.50	01/13/2022
Inactive	Cajun Chicken Pasta (LowCal)	£6.50	07/12/2022
Inactive	Cajun Turkey Meatballs	£8.50	01/13/2022
Inactive	Chicken & Bacon Alfredo Pasta	£8.00	09/29/2024
Inactive	Chicken & Bacon Alfredo Pasta (Trojan)	£8.00	10/11/2024
Inactive	Chicken & Chorizo Baked Rice	£8.50	10/18/2023
Inactive	Chicken & Chorizo Baked Rice (LowCal)	£6.50	12/09/2023
Inactive	Chicken Alpasto	£8.50	07/08/2025
Inactive	Chicken Alpasto (Trojan)	£8.50	08/05/2025
Inactive	Chicken Breast with New Potatoes & Veggies - BBQ	£8.00	01/20/2021
Inactive	Chicken Breast with Rice & Veg - BBQ  (Trojan)	£6.50	03/02/2024
Inactive	Chicken Breast with Rice & Veg - BBQ (LowCal)	£6.50	10/04/2021
Inactive	Chicken Breast with Rice & Veg - Honey & Garlic	£8.00	01/19/2021
Inactive	Chicken Breast with Rice & Veg - Plain	£8.00	01/19/2021
Inactive	Chicken Breast with Roasted New Potatoes - Honey & Garlic	£8.00	05/20/2021
Inactive	Chicken Breast with Sweet Potato Mash & Veg - BBQ (LowCal)	£6.50	12/05/2023
Inactive	Chicken Breast Wrap - Bang Bang	£5.50	02/22/2022
Inactive	Chicken Breast Wrap - BBQ	£5.50	01/28/2021
Inactive	Chicken Breast Wrap - Cajun	£5.50	05/23/2021
Inactive	Chicken Breast Wrap - Sweet Chilli	£5.50	01/20/2021
Inactive	Chicken Caesar Salad	£7.00	07/30/2021
Inactive	Chicken Caesar Salad TASTER	£5.50	10/03/2021
Inactive	Chicken Chow Mein	£8.50	01/25/2022
Inactive	Chicken Enchiladas	£8.50	06/11/2023
Inactive	Chicken Enchiladas (LowCal)	£6.50	12/03/2023
Inactive	Chicken Jalfrezi and New Potatoes	£9.00	04/07/2025
Active	Chicken Jalfrezi and Pilau Rice	£9.00	04/07/2025
Active	Chicken Jalfrezi and Pilau Rice (LowCal)	£7.50	04/07/2025
Inactive	Chicken Jalfrezi and Pilau Rice (Trojan)	£9.00	07/12/2025
Inactive	Chicken Korma with Basmati Rice	£8.50	03/23/2022
Inactive	Chicken Korma with Basmati Rice - 800cal	£8.50	03/23/2022
Inactive	Chicken Pesto Pasta	£9.00	03/03/2025
Inactive	Chicken Pesto Pasta (LowCal)	£7.50	03/05/2025
Inactive	Chicken Pesto Pasta (Trojan)	£8.00	03/21/2025
Inactive	Chicken Quesadilla & Egg Fried Rice	£8.50	01/05/2023
Inactive	Chicken Roast Dinner	£8.50	11/08/2023
Inactive	Chicken Shawarma with Herb Roasted Potatoes & Veggies	£7.50	05/14/2022
Inactive	Chicken Shawarma with Quinoa & Roasted Vegetables	£7.50	05/08/2021
Inactive	Chicken Shawarma with Quinoa & Roasted Vegetables  (Low calories)	£7.50	07/07/2021
Inactive	Chicken Shawarma with Wholegrain Rice & Veggies	£7.50	05/14/2022
Inactive	Chicken Skewers	£5.00	01/19/2021
Inactive	Chicken Stir Fry with Oyster Sauce	£8.50	01/19/2021
Inactive	Chicken Stir Fry with Plum Sauce	£8.50	05/20/2021
Inactive	Chicken Tikka Breast with Yoghurt & Mint Dip	£8.00	08/16/2024
Inactive	Chicken Tikka Breast with Yoghurt & Mint Dip (Trojan)	£8.00	08/16/2024
Inactive	Chicken Tikka Masala with Basmati Rice	£8.50	12/31/2024
Inactive	Chicken Tikka Masala with Basmati Rice (LowCal)	£6.50	12/31/2024
Inactive	Chicken Zoodle Stir Fry - Sweet Chilli	£8.50	07/07/2021
Inactive	Chicken, Sweet Potato & Broccoli	£10.00	04/12/2025
Inactive	Chilli Con Carne	£8.50	01/23/2024
Inactive	Chilli Con Carne (LowCal)	£6.50	01/23/2024
Inactive	Chinese Chicken	£8.00	09/01/2024
Inactive	Chinese Chicken (LowCal)	£6.50	09/04/2024
Inactive	Chinese Chicken (Trojan)	£6.50	10/11/2024
Active	Chipotle Beef Bowl	£9.00	06/23/2025
Active	Chipotle Beef Bowl (BIG)	£12.00	06/23/2025
Active	Chipotle Beef Bowl (LowCal)	£7.50	06/23/2025
Inactive	Chipotle Beef Bowl (Trojan)	£9.00	06/27/2025
Active	Chipotle Chicken Tagliatelle	£9.00	12/31/2024
Active	Chipotle Chicken Tagliatelle (BIG)	£12.00	04/14/2025
Active	Chipotle Chicken Tagliatelle (LowCal)	£7.50	12/31/2024
Inactive	Chipotle Chicken Tagliatelle (Trojan)	£8.50	01/03/2025
Inactive	Chocolate Protein Brownie Balls	£3.50	07/03/2022
Active	Chorizo & Spinach Omelette	£8.50	01/11/2023
Inactive	Chorizo & Spinach Omelette - 250g Carbs	£10.00	01/17/2025
Active	Chorizo & Spinach Omelette (BIG)	£10.00	04/14/2025
Active	Chorizo & Spinach Omelette (LowCal)	£7.50	08/30/2024
Inactive	Creamy Chicken Linguine	£8.50	06/28/2021
Inactive	Creamy Chicken Linguine (800cal)	£8.50	07/08/2021
Inactive	Creamy Tuscan Chicken with Basmati Rice	£8.70	12/31/2024
Inactive	Creamy Tuscan Chicken with Cauli Rice	£8.75	08/21/2023
Inactive	Creamy Tuscan Chicken with Rice (LowCal)	£6.50	11/25/2023
Inactive	Creamy Tuscan Chicken with Roasted New Potatoes	£8.75	08/23/2023
Inactive	Crispy Chilli Beef	£9.99	02/22/2022
Active	Crispy Chilli Chicken	£9.00	04/14/2022
Inactive	Crispy Chilli Chicken -150g Carbs	£8.00	01/17/2025
Active	Crispy Chilli Chicken (BIG)	£12.00	04/09/2025
Active	Crispy Chilli Chicken (LowCal)	£7.50	07/26/2022
Inactive	Crispy Chilli Chicken (Trojan)	£6.25	03/02/2024
Inactive	Crusted Pesto Chicken	£8.50	01/05/2023
Active	Fajita Burrito Bowl	£9.00	08/13/2025
Active	Fajita Burrito Bowl (LowCal)	£7.50	08/13/2025
Inactive	Fajita Burrito Bowl (Trojan)	£9.00	08/29/2025
Inactive	Fishcakes & Vegetable	£8.50	05/20/2021
Inactive	Garlic & Honey Glaze Salmon, Sweet Potato & Veggies	£9.50	01/19/2021
Inactive	Garlic & Lemon Chicken	£9.00	06/23/2025
Inactive	Garlic & Lemon Chicken (Trojan)	£9.00	08/05/2025
Inactive	General Tso's Oriental Chicken	£8.00	08/18/2022
Inactive	Greek Chicken with Couscous	£8.50	06/09/2023
Inactive	Greek Skewers with Couscous & Tzatziki	£9.00	08/17/2022
Inactive	Grilled Chicken & Rice	£6.00	01/17/2021
Inactive	Grilled Chicken Breast Fillet	£5.50	01/17/2021
Inactive	Grilled Salmon Fillet	£7.50	01/19/2021
Inactive	Halloumi Poke Bowl	£8.00	02/02/2024
Inactive	Healthy Chicken Curry & New Potatoes	£8.50	01/19/2021
Inactive	Healthy Chicken Curry & Rice	£8.50	01/19/2021
Inactive	Healthy Chicken Curry & Rice  (Low calories)	£8.00	07/07/2021
Inactive	Healthy Chicken Curry & Rice (Trojan)	£8.50	01/03/2025
Inactive	Healthy Chicken Curry with Rice (LowCal)	£6.25	10/03/2021
Inactive	Healthy Chicken Curry with White Rice - SPICY	£8.50	01/19/2021
Inactive	Healthy Chicken Stir Fry	£8.50	01/17/2021
Inactive	Healthy Chicken Stir Fry - Lemon & Herb TASTER	£5.50	10/03/2021
Inactive	Healthy Chicken Stir Fry - Oyster Sauce TASTER	£6.25	10/03/2021
Inactive	Healthy Chicken Stir Fry - Plain TASTER	£6.25	10/03/2021
Inactive	Healthy Chicken Stir Fry - Sweet Chilli TASTER	£6.25	10/03/2021
Inactive	Healthy Chicken Stir Fry (Plain)	£8.50	01/19/2021
Inactive	Healthy Sweet & Sour Chicken Rice Bowl	£7.50	03/26/2021
Active	Honey & Garlic Bowl with Basmati Rice (LowCal)	£7.50	07/26/2022
Active	Honey & Garlic Bowl with Roasted New Potatoes (LowCal)	£7.50	12/05/2023
Active	Honey & Garlic Chicken Bowl with Basmati & Broccoli	£9.00	01/26/2022
Inactive	Honey & Garlic Chicken Bowl with Basmati & Broccoli - 250g Carbs	£8.50	01/24/2025
Active	Honey & Garlic Chicken Bowl with Roasted New Potatoes	£9.00	07/15/2022
Inactive	Honey & Garlic Chicken Bowl with Roasted New Potatoes -  250g Carbs	£8.50	01/17/2025
Inactive	Honey & Garlic Chicken Bowl with Roasted New Potatoes - 250g Carbs	£10.00	03/14/2025
Active	Honey & Garlic Chicken Bowl with Wholegrain Rice & Veggies	£9.00	05/14/2022
Inactive	Honey & Garlic Chicken Skewers with Rice & Veg	£8.00	01/19/2021
Inactive	Honey Garlic Chicken with Quinoa & Broccoli	£7.50	05/08/2021
Inactive	Honey Garlic Chicken with Quinoa & Broccoli  (Low calories)	£7.50	07/07/2021
Inactive	Honey Sweet Chicken with Basmati Rice	£7.50	06/13/2022
Inactive	Hunters Chicken	£8.50	05/14/2022
Active	Ingredients 100g	£25.00	01/24/2021
Inactive	Katsu Chicken	£8.50	03/06/2024
Inactive	Katsu Chicken (LowCal)	£6.50	04/02/2024
Inactive	Katsu Chicken (Trojan)	£6.50	03/23/2024
Inactive	Katsu Chicken Curry & Roasted New Potatoes	£8.50	07/05/2021
Inactive	Katsu Chicken Curry With Basmati Rice	£8.50	09/15/2021
Inactive	Katsu Chicken Noodles	£8.50	09/25/2023
Active	Korean Beef Bowl	£9.00	03/27/2024
Inactive	Korean Beef Bowl - 250g Carbs	£8.50	01/17/2025
Active	Korean Beef Bowl (BIG)	£12.00	04/09/2025
Active	Korean Beef Bowl (LowCal)	£7.50	08/30/2024
Inactive	Korean Beef Bowl (Trojan)	£8.50	04/12/2024
Active	Korean Beef Quesadilla	£9.00	08/13/2025
Active	Korean Chicken Bowl	£9.00	04/01/2024
Active	Korean Chicken Bowl (BIG)	£12.00	04/14/2025
Active	Korean Chicken Bowl (LowCal)	£7.50	08/30/2024
Inactive	Korean Chicken Bowl (Trojan)	£9.00	08/29/2025
Inactive	Korean Chicken Noodles	£8.50	04/01/2024
Inactive	Korean Chicken Noodles - Trojan	£8.50	09/13/2024
Inactive	Korean Chicken Noodles (LowCal)	£6.50	04/01/2024
Inactive	Korean Steak Noodles	£9.99	04/01/2024
Inactive	Kung Pao Chicken	£8.50	09/02/2021
Inactive	Lean Beef & Pineapple Zoodles	£8.50	03/15/2021
Inactive	Lean Beef Meatballs in Tomato Sauce	£9.50	12/30/2024
Inactive	Lean Beef Meatballs in Tomato Sauce - 250g Carbs	£9.50	01/17/2025
Inactive	Lean Beef Meatballs in Tomato Sauce - SPICY	£9.50	01/19/2021
Inactive	Lean Beef Meatballs in Tomato Sauce (LowCal)	£0.00	03/28/2025
Inactive	Lemon & Herb Chicken Skewers with Rice & Veg	£8.00	01/19/2021
Inactive	Lemon & Herb Chicken Stir Fry	£8.50	01/19/2021
Inactive	Lemon & Herb Chicken with Sweet Potato Wedges & Mixed Veg	£8.00	01/25/2021
Inactive	Lemon & Herb Drizzle - Salmon, Sweet Potato & Veggies	£9.50	01/19/2021
Inactive	Lemon & Herb Grilled Chicken Breast with Rice & Veg	£8.00	01/19/2021
Inactive	Lemon & Herb Vegetarian Stir Fry	£7.50	01/19/2021
Inactive	Low Carb Pepperoni Pizza Bowl	£9.00	03/26/2025
Inactive	Malaysian Beef Bowl	£8.50	06/11/2023
Inactive	Malaysian Beef Bowl (LowCal)	£6.50	11/25/2023
Inactive	Malaysian Beef Bowl (Trojan)	£8.50	03/08/2024
Inactive	Malaysian Chicken Skewers	£8.50	03/06/2023
Inactive	Malaysian Sliced Chicken Breast	£8.50	05/16/2023
Inactive	Malaysian Sliced Chicken Breast (LowCal)	£6.25	11/21/2023
Inactive	Meal Prep Variety Taster Pack	£30.00	01/24/2021
Inactive	Mexican Fajitas	£8.50	01/11/2023
Inactive	Mongolian Chicken	£8.00	11/07/2022
Active	Mongolian Chicken Noodles	£9.00	11/09/2022
Active	Mongolian Chicken Noodles (BIG)	£12.00	05/25/2025
Active	Mongolian Chicken Noodles (LowCal)	£7.50	12/06/2023
Inactive	Mongolian Chicken Noodles (Trojan)	£9.00	05/30/2025
Inactive	Mongolian Steak	£9.50	09/02/2021
Inactive	Mongolian Steak	£9.99	11/07/2022
Inactive	Moroccan Chicken with Couscous	£8.50	07/11/2022
Inactive	Naked Beef Burger with Sweet Potato Wedges (BBQ Sauce)	£9.00	01/31/2025
Inactive	Naked Beef Burger with Sweet Potato Wedges (BBQ Sauce)  (Trojan)	£8.50	09/13/2024
Inactive	Naked Beef Burger with Sweet Potato Wedges (Burger Sauce)	£9.00	06/16/2024
Inactive	Nutritious Chicken Curry	£8.00	01/17/2021
Inactive	Pad Thai	£8.50	09/15/2021
Inactive	Paprika & Nutmeg Chicken Skewers with Rice & Veg	£8.00	01/19/2021
Active	Parmesan Chicken w/ New Potatoes (BIG)	£12.00	04/14/2025
Inactive	Parmesan Chicken with Cauli Bites	£8.50	08/04/2023
Active	Parmesan Chicken with Roasted New Potatoes	£9.00	08/20/2023
Active	Parmesan Chicken with Roasted New Potatoes (LowCal)	£7.50	12/12/2023
Inactive	Parmesan Chicken with Roasted New Potatoes (Trojan)	£9.00	08/08/2025
Inactive	Peanut Butter Bites	£3.50	07/03/2022
Active	Penne Bolognese	£9.00	04/12/2023
Inactive	Penne Bolognese  (Trojan)	£6.50	03/02/2024
Active	Penne Bolognese (LowCal)	£7.50	05/14/2025
Inactive	Pepperoni & Chicken Quesadilla	£9.00	03/03/2025
Inactive	Pepperoni & Chicken Quesadilla (LowCal)	£7.50	03/05/2025
Inactive	Pepperoni & Chicken Quesadilla (Trojan)	£8.00	03/28/2025
Inactive	Pepperoni Chicken Pasta Bake	£9.00	10/29/2023
Inactive	Pepperoni Chicken Pasta Bake (LowCal)	£7.50	11/16/2023
Inactive	Pepperoni Chicken Pasta Bake (Trojan)	£9.00	05/30/2025
Inactive	Pepperoni Pizza Bowl	£9.00	03/26/2025
Inactive	Pepperoni Pizza Bowl (LowCal)	£7.50	03/26/2025
Inactive	Pepperoni Pizza Bowl (Trojan)	£9.00	04/25/2025
Inactive	Peri Peri Chicken & Broctatoes	£8.50	01/05/2022
Inactive	Philly Cheese Steak Pepper	£8.50	03/26/2021
Inactive	Philly Cheese Steak Pepper & Salad  (Low calories)	£8.50	07/07/2021
Inactive	Plain Chicken Stir Fry  (Low calories)	£8.50	07/07/2021
Inactive	Plain Grilled Chicken Breast with Rice & Veg  (Low calories)	£8.00	07/07/2021
Inactive	Plain Grilled Chicken Skewers with Rice & Veg	£8.00	01/19/2021
Inactive	Plain Salmon, Sweet Potato & Veggies	£9.50	01/19/2021
Inactive	Prosciutto Wrapped Cod Loin with Herb Oil	£9.50	01/19/2021
Inactive	Prosciutto Wrapped Cod Loin with Lemon & Herb Drizzle	£9.50	01/19/2021
Inactive	Prosciutto Wrapped Cod Loin with New Potatoes, Veggies and Tomato Sauce	£9.50	01/28/2021
Inactive	Prosciutto Wrapped Cod Loin with Sweet Potato Mash and Fresh Vegetables	£9.50	01/17/2021
Inactive	Prosciutto Wrapped Cod Loin with Tomato sauce	£9.50	01/19/2021
Inactive	Protein Pancakes with Honey	£7.00	08/23/2022
Inactive	Pulled Chicken Tikka Lasagne	£8.75	10/29/2023
Inactive	Pulled Chicken Tikka Lasagne (LowCal)	£6.50	12/05/2023
Inactive	Random	£8.50	03/14/2021
Inactive	Red Pepper Pasta	£8.50	12/31/2024
Inactive	Red Pepper Pasta (Trojan)	£8.50	12/15/2024
Inactive	Red Thai Chicken Noodles	£9.00	02/10/2025
Inactive	Red Thai Chicken Noodles (LowCal)	£7.50	02/12/2025
Inactive	Red Thai Chicken Noodles (Trojan)	£8.00	04/04/2025
Inactive	Salmon, Sweet Potato & Veggies	£9.50	01/17/2021
Inactive	Salmon, Sweet Potato & Veggies with Red Pepper Sauce	£9.50	01/19/2021
Inactive	Satay Chicken	£8.50	05/20/2024
Inactive	Satay Chicken (LowCal)	£6.80	06/22/2024
Inactive	Satay Chicken (Trojan)	£6.50	05/24/2024
Inactive	Scrambled Egg Only - With 10 Eggs	£7.50	02/07/2025
Inactive	Scrambled Egg Shakshuka	£6.50	12/27/2023
Inactive	Sesame Chicken  (Low calories)	£8.00	07/07/2021
Inactive	Sesame Chicken TASTER	£6.25	10/03/2021
Inactive	Sesame Chicken with Rice & Broccoli	£8.00	03/13/2021
Inactive	Sesame Chicken with Rice & Broccoli (800cal)	£8.00	07/08/2021
Inactive	Singapore Chicken Noodles	£8.50	07/11/2022
Inactive	Singapore Chicken Noodles (LowCal)	£6.25	07/26/2022
Active	Sliced Cajun Chicken Breast with Cauli Fried Rice	£9.00	03/07/2023
Active	Sliced Cajun Chicken Breast with Cauli Fried Rice (LowCal)	£7.50	12/03/2023
Active	Sliced Cajun Chicken Breast with Roasted New Potatoes	£9.00	03/06/2023
Active	Sliced Cajun Chicken Breast with Roasted New Potatoes (LowCal)	£7.50	05/19/2023
Inactive	Smokey Breakfast Muffins	£7.50	01/11/2023
Active	Southern Style Chicken	£9.00	11/27/2024
Inactive	Southern Style Chicken - With Rice (Trojan)	£9.00	06/07/2025
Active	Southern Style Chicken (BIG)	£12.00	04/14/2025
Active	Southern Style Chicken (LowCal)	£7.50	01/29/2025
Inactive	Spaghetti Bolognese	£8.00	06/13/2022
Inactive	Spicy Mango Chicken	£8.50	06/11/2023
Inactive	Sticky Asian Chicken Bowl	£8.50	08/17/2023
Inactive	Sticky Chicken Noodles	£8.50	04/14/2022
Inactive	Sticky Chicken Noodles TASTER	£6.25	07/31/2022
Inactive	Sticky Steak Noodles	£9.99	04/14/2022
Inactive	Sweet & Sour Chicken  (Low calories)	£7.50	07/07/2021
Inactive	Sweet & Sour Chicken Bowl	£8.50	03/27/2021
Inactive	Sweet & Sour Chicken Bowl (LowCal)	£6.50	01/13/2024
Inactive	Sweet & Sour TASTER	£5.75	10/03/2021
Active	Sweet Chilli Chicken Noodles	£9.00	12/27/2023
Inactive	Sweet Chilli Chicken Noodles  (Trojan)	£8.50	03/02/2024
Active	Sweet Chilli Chicken Noodles (BIG)	£12.00	04/14/2025
Active	Sweet Chilli Chicken Noodles (LowCal)	£7.50	01/01/2024
Inactive	Sweet Chilli Chicken Skewers with Rice & Veggies	£8.00	01/23/2021
Inactive	Sweet Chilli Chicken Stir Fry	£8.50	01/19/2021
Inactive	Sweet Chilli Grilled Chicken Breast with Rice & Veg	£8.00	01/19/2021
Active	Sweet Chilli Vegetarian Stir Fry	£8.50	01/19/2021
Inactive	Sweet Honey & Ginger Stir Fry	£8.50	01/19/2021
Inactive	Sweet Honey & Ginger Vegetarian Stir Fry	£7.50	01/19/2021
Active	Sweet Potato & Chickpea Curry	£8.50	02/22/2022
Inactive	Sweet Potato Cottage Pie	£8.75	04/06/2023
Inactive	Sweet Potato Cottage Pie (LowCal)	£6.50	11/25/2023
Inactive	Tandoori & Pineapple Skewers	£8.00	02/22/2022
Inactive	Tandoori Chicken & Pilau Rice	£9.00	02/24/2025
Inactive	Tender Beef Casserole with New Potatoes	£8.00	03/15/2021
Inactive	Tender Teriyaki TASTER	£5.50	10/04/2021
Inactive	Teriyaki Chicken Poke Bowl	£8.00	02/02/2024
Inactive	Teriyaki Chicken with Pineapple	£7.50	03/23/2022
Inactive	Teriyaki Chicken with Pineapple  (Low calories)	£7.50	05/22/2021
Active	Tex-Mex Beef Bowl	£9.00	02/15/2024
Active	Tex-Mex Beef Bowl (BIG)	£12.00	05/25/2025
Active	Tex-Mex Beef Bowl (LowCal)	£7.50	02/18/2024
Inactive	Tex-Mex Beef Bowl (Trojan)	£8.00	09/13/2024
Inactive	Thai Basil Beef	£8.50	12/31/2024
Inactive	Thai Basil Beef - 250g Carbs	£8.50	01/24/2025
Inactive	Thai Basil Beef (LowCal)	£6.50	12/31/2024
Inactive	Thai Green Curry with Rice	£8.50	05/22/2021
Inactive	Thai Red Curry	£8.00	04/08/2024
Inactive	Thai Red Curry (Trojan)	£8.00	04/12/2024
Inactive	The Lean Lasagne	£9.00	01/12/2022
Inactive	The Lean Lasagne (Trojan)	£7.50	03/07/2025
Inactive	Tofu Poke Bowl	£8.00	02/24/2024
Inactive	Tso's Oriental Chicken Noodles	£8.50	08/18/2022
Inactive	Turkey Taco Zuchinni Boats	£7.50	03/14/2021
Inactive	Ultimate Beef Burger with Sweet Potato Wedges	£10.50	04/18/2023
Inactive	Ultimate Beef Burger with Wedges	£9.99	04/17/2023
Inactive	Ultimate Turkey Burger with Sweet Potato Wedges	£9.00	01/17/2021
Inactive	Vegan Chickpea & Lentil Curry	£7.50	03/13/2021
Inactive	Vegetarian Enchilada	£7.50	11/06/2023
Inactive	Vegetarian Singapore Noodles	£7.50	11/13/2023
Inactive	Vegetarian Stir Fry	£7.50	01/17/2021
Active	Vegetarian Stuffed Peppers	£8.50	03/07/2024
Active	Veggie Omelette	£8.50	04/16/2025
Active	Veggie Omelette (BIG)	£12.00	06/16/2025`;

export async function importGoPrepMenu() {
  try {
    console.log('Starting menu import...');
    
    // Parse the data
    const lines = menuData.trim().split('\n');
    const headers = lines[0].split('\t');
    
    const meals = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('\t');
      
      if (values.length >= 4) {
        const status = values[0];
        const title = values[1];
        const price = values[2];
        const added = values[3];
        
        // Parse price - remove £ and convert to number
        const parsedPrice = parseFloat(price.replace('£', ''));
        
        // Parse date - convert MM/DD/YYYY to YYYY-MM-DD
        const dateParts = added.split('/');
        const parsedDate = `20${dateParts[2]}-${dateParts[0].padStart(2, '0')}-${dateParts[1].padStart(2, '0')}`;
        
        // Determine category from title
        let category = 'main';
        const titleLower = title.toLowerCase();
        
        if (titleLower.includes('breakfast') || titleLower.includes('omelette') || titleLower.includes('pancakes')) {
          category = 'breakfast';
        } else if (titleLower.includes('cheesecake') || titleLower.includes('brownie') || titleLower.includes('bites')) {
          category = 'dessert';
        } else if (titleLower.includes('wrap') || titleLower.includes('salad')) {
          category = 'light';
        } else if (titleLower.includes('curry') || titleLower.includes('noodles') || titleLower.includes('pasta') || titleLower.includes('bowl')) {
          category = 'dinner';
        }
        
        // Extract description from title patterns
        let description = '';
        if (titleLower.includes('korean')) description = 'Korean-inspired flavors';
        else if (titleLower.includes('thai')) description = 'Thai-inspired cuisine';
        else if (titleLower.includes('mexican') || titleLower.includes('fajita')) description = 'Mexican-inspired dish';
        else if (titleLower.includes('italian') || titleLower.includes('pasta') || titleLower.includes('bolognese')) description = 'Italian-inspired';
        else if (titleLower.includes('chinese') || titleLower.includes('bang bang')) description = 'Chinese-inspired flavors';
        else if (titleLower.includes('indian') || titleLower.includes('jalfrezi') || titleLower.includes('curry')) description = 'Indian-inspired spices';
        else description = 'Delicious and nutritious meal';
        
        meals.push({
          name: title,
          description: description,
          category: category,
          price: parsedPrice,
          is_active: status === 'Active',
          created_at: parsedDate
        });
      }
    }
    
    console.log(`Parsed ${meals.length} meals`);
    
    // Clear existing test meals
    await supabase.from('meals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Insert meals in batches
    const batchSize = 50;
    let imported = 0;
    
    for (let i = 0; i < meals.length; i += batchSize) {
      const batch = meals.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('meals')
        .insert(batch);
      
      if (error) {
        console.error('Error inserting batch:', error);
        throw error;
      }
      
      imported += batch.length;
      console.log(`Imported ${imported}/${meals.length} meals`);
    }
    
    console.log('Menu import completed successfully!');
    return { success: true, imported: meals.length };
    
  } catch (error) {
    console.error('Import failed:', error);
    return { success: false, error: error.message };
  }
}

// GoPrep ingredients extracted from the production report (with default nutrition values to be updated later)
const goPrepIngredients = [
  { name: 'Chicken Breast', description: 'Boneless, skinless chicken breast', default_unit: 'g' },
  { name: 'Spaghetti', description: 'Pasta', default_unit: 'g' },
  { name: 'Mayo (Light)', description: 'Light mayonnaise', default_unit: 'g' },
  { name: 'Sweet Chilli Sauce', description: 'Sweet chilli sauce', default_unit: 'g' },
  { name: 'Sriracha Sauce', description: 'Sriracha hot sauce', default_unit: 'g' },
  { name: 'Garlic', description: 'Fresh garlic', default_unit: 'g' },
  { name: 'Smoked Paprika', description: 'Smoked paprika seasoning', default_unit: 'g' },
  { name: 'Olive Oil (Extra Virgin)', description: 'Extra virgin olive oil', default_unit: 'g' },
  { name: 'Parsley', description: 'Fresh parsley', default_unit: 'g' },
  { name: 'Lime Juice', description: 'Fresh lime juice', default_unit: 'g' },
  { name: 'Chilli Flakes', description: 'Dried chilli flakes', default_unit: 'g' },
  { name: 'Lean Beef Mince 5%', description: '5% fat lean beef mince', default_unit: 'g' },
  { name: 'Chopped Tomatoes', description: 'Canned chopped tomatoes', default_unit: 'g' },
  { name: 'Basmati Rice (Tilda)', description: 'Tilda basmati rice', default_unit: 'g' },
  { name: 'Cauliflower', description: 'Fresh cauliflower', default_unit: 'g' },
  { name: 'White Onion', description: 'White onion', default_unit: 'g' },
  { name: 'Red Peppers', description: 'Red bell peppers', default_unit: 'g' },
  { name: 'Coconut Milk', description: 'Coconut milk', default_unit: 'ml' },
  { name: 'Chilli (Red)', description: 'Fresh red chilli', default_unit: 'g' },
  { name: 'Ginger', description: 'Fresh ginger', default_unit: 'g' },
  { name: 'Garam Masala', description: 'Garam masala spice mix', default_unit: 'g' },
  { name: 'Cumin', description: 'Ground cumin', default_unit: 'g' },
  { name: 'Tumeric', description: 'Ground turmeric', default_unit: 'g' },
  { name: 'Ground Coriander', description: 'Ground coriander', default_unit: 'g' },
  { name: 'Himalayan Pink Salt', description: 'Himalayan pink salt', default_unit: 'g' },
  { name: 'Beef Bouillon Paste', description: 'Beef stock paste', default_unit: 'g' },
  { name: 'Fresh Coriander', description: 'Fresh coriander leaves', default_unit: 'g' },
  { name: 'Potato', description: 'Potato', default_unit: 'g' },
  { name: 'Buffalo Sauce', description: 'Buffalo sauce', default_unit: 'g' },
  { name: 'Tomatoes', description: 'Fresh tomatoes', default_unit: 'g' },
  { name: 'Cucumber', description: 'Fresh cucumber', default_unit: 'g' },
  { name: 'Red Onion', description: 'Red onion', default_unit: 'g' },
  { name: 'Lemon Juice', description: 'Fresh lemon juice', default_unit: 'g' },
  { name: 'Unsalted Butter', description: 'Unsalted butter', default_unit: 'g' },
  { name: 'Honey', description: 'Natural honey', default_unit: 'g' },
  { name: 'Garlic Powder', description: 'Garlic powder', default_unit: 'g' },
  { name: 'Black Pepper', description: 'Ground black pepper', default_unit: 'g' },
  { name: 'New Potatoes', description: 'New potatoes', default_unit: 'g' },
  { name: 'Carrots', description: 'Fresh carrots', default_unit: 'g' },
  { name: 'Yellow Pepper', description: 'Yellow bell pepper', default_unit: 'g' },
  { name: 'Cajun Spice', description: 'Cajun spice mix', default_unit: 'g' },
  { name: 'Chicken Bouillon Paste', description: 'Chicken stock paste', default_unit: 'g' },
  { name: 'Chipotle Paste', description: 'Chipotle paste', default_unit: 'g' },
  { name: 'Green Beans', description: 'Fresh green beans', default_unit: 'g' },
  { name: 'Tomato Ketchup (Heinz)', description: 'Heinz tomato ketchup', default_unit: 'g' },
  { name: 'Spring Onion', description: 'Spring onions', default_unit: 'g' },
  { name: 'Onion Powder', description: 'Onion powder', default_unit: 'g' },
  { name: 'Chipotle Chilli Flakes', description: 'Chipotle chilli flakes', default_unit: 'g' },
  { name: 'Milk (Semi-skimmed)', description: 'Semi-skimmed milk', default_unit: 'g' },
  { name: 'Tagliatelle', description: 'Tagliatelle pasta', default_unit: 'g' },
  { name: 'Chorizo', description: 'Chorizo sausage', default_unit: 'g' },
  { name: 'Egg', description: 'Chicken eggs', default_unit: 'g' },
  { name: 'Cheddar', description: 'Cheddar cheese', default_unit: 'g' },
  { name: 'Spinach', description: 'Fresh spinach', default_unit: 'g' },
  { name: 'Cornflour', description: 'Cornflour', default_unit: 'g' },
  { name: 'Chinese 5 Spice Seasoning', description: 'Chinese five spice', default_unit: 'g' },
  { name: 'Light Soy Sauce', description: 'Light soy sauce', default_unit: 'ml' },
  { name: 'Sesame Seeds', description: 'Sesame seeds', default_unit: 'g' },
  { name: 'Black Beans', description: 'Black beans', default_unit: 'g' },
  { name: 'Tabasco', description: 'Tabasco sauce', default_unit: 'g' },
  { name: 'Broccoli', description: 'Fresh broccoli', default_unit: 'g' },
  { name: 'White Rice Wine Vinegar', description: 'White rice wine vinegar', default_unit: 'g' },
  { name: 'Sesame Oil', description: 'Sesame oil', default_unit: 'g' },
  { name: 'Wholegrain Rice', description: 'Wholegrain rice', default_unit: 'g' },
  { name: 'Creme Fraiche (Light)', description: 'Light creme fraiche', default_unit: 'g' },
  { name: 'Bacon Medallion', description: 'Bacon medallions', default_unit: 'g' },
  { name: 'New Potatoes (Boiled)', description: 'Boiled new potatoes', default_unit: 'g' },
  { name: 'Honey (Rowse)', description: 'Rowse honey', default_unit: 'g' },
  { name: 'Sriracha Hot Chilli Sauce', description: 'Sriracha hot chilli sauce', default_unit: 'g' },
  { name: 'Chinese 5 Spice', description: 'Chinese five spice powder', default_unit: 'g' },
  { name: 'fresh parsley', description: 'Fresh parsley', default_unit: 'g' },
  { name: 'lime juiced', description: 'Lime juice', default_unit: 'g' },
  { name: 'Mozzarella & Cheddar Mix', description: 'Mozzarella and cheddar cheese mix', default_unit: 'g' },
  { name: 'Dark Soy Sauce', description: 'Dark soy sauce', default_unit: 'g' },
  { name: 'Tomato Paste', description: 'Tomato paste', default_unit: 'g' },
  { name: 'Flour Tortilla', description: 'Flour tortilla wrap', default_unit: 'g' },
  { name: 'Thyme', description: 'Dried thyme', default_unit: 'g' },
  { name: 'Oregano', description: 'Dried oregano', default_unit: 'g' },
  { name: 'Cayenne', description: 'Cayenne pepper', default_unit: 'g' },
  { name: 'Egg Noodles', description: 'Egg noodles', default_unit: 'g' },
  { name: 'Parmesan', description: 'Parmesan cheese', default_unit: 'g' },
  { name: 'Basil (Dried)', description: 'Dried basil', default_unit: 'g' },
  { name: 'Penne Pasta', description: 'Penne pasta', default_unit: 'g' },
  { name: 'Red Cooking Wine', description: 'Red cooking wine', default_unit: 'g' },
  { name: 'Peas', description: 'Green peas', default_unit: 'g' },
  { name: 'Worcestershire Sauce', description: 'Worcestershire sauce', default_unit: 'g' },
  { name: 'White Pepper (Ground)', description: 'Ground white pepper', default_unit: 'g' },
  { name: 'Shallots', description: 'Shallots', default_unit: 'g' },
  { name: 'Sweet Potato', description: 'Sweet potato', default_unit: 'g' },
  { name: 'Chickpeas', description: 'Chickpeas', default_unit: 'g' },
  { name: 'Turmeric', description: 'Ground turmeric', default_unit: 'g' },
  { name: 'Chilli Powder', description: 'Chilli powder', default_unit: 'g' },
  { name: 'Sweetcorn', description: 'Sweetcorn', default_unit: 'g' },
  { name: 'Mozzarella', description: 'Mozzarella cheese', default_unit: 'g' },
  { name: 'Vegetable Stock', description: 'Vegetable stock', default_unit: 'g' },
  { name: 'red pepper', description: 'Red bell pepper', default_unit: 'g' }
].map(ingredient => ({
  ...ingredient,
  calories_per_100g: 0,
  protein_per_100g: 0,
  carbs_per_100g: 0,
  fat_per_100g: 0,
  fiber_per_100g: 0,
  sugar_per_100g: 0,
  sodium_per_100g: 0
}));

// Sample meal ingredients mapping
const sampleMealIngredients = {
  'Bang Bang Chicken': [
    { ingredient: 'Chicken Breast', quantity: 150 },
    { ingredient: 'Basmati Rice', quantity: 100 },
    { ingredient: 'Broccoli', quantity: 80 },
    { ingredient: 'Olive Oil', quantity: 10 }
  ],
  'Beef Jalfrezi and Pilau Rice': [
    { ingredient: 'Beef Mince', quantity: 120 },
    { ingredient: 'Basmati Rice', quantity: 100 },
    { ingredient: 'Bell Pepper', quantity: 60 },
    { ingredient: 'Onion', quantity: 40 },
    { ingredient: 'Olive Oil', quantity: 8 }
  ],
  'Penne Bolognese': [
    { ingredient: 'Beef Mince', quantity: 100 },
    { ingredient: 'Penne Pasta', quantity: 80 },
    { ingredient: 'Tomato Sauce', quantity: 100 },
    { ingredient: 'Onion', quantity: 30 },
    { ingredient: 'Olive Oil', quantity: 5 }
  ],
  'Chorizo & Spinach Omelette': [
    { ingredient: 'Eggs', quantity: 100 },
    { ingredient: 'Spinach', quantity: 60 },
    { ingredient: 'Cheese', quantity: 30 },
    { ingredient: 'Olive Oil', quantity: 8 }
  ],
  'Honey & Garlic Chicken Bowl with Basmati & Broccoli': [
    { ingredient: 'Chicken Breast', quantity: 140 },
    { ingredient: 'Basmati Rice', quantity: 90 },
    { ingredient: 'Broccoli', quantity: 100 },
    { ingredient: 'Garlic', quantity: 5 },
    { ingredient: 'Olive Oil', quantity: 12 }
  ]
};

export const importGoPrepIngredients = async () => {
  try {
    // Clear existing ingredients
    const { error: deleteError } = await supabase
      .from('ingredients')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
      console.error('Error clearing existing ingredients:', deleteError);
      return { success: false, error: 'Failed to clear existing ingredients' };
    }

    // Insert ingredients
    const { data, error } = await supabase
      .from('ingredients')
      .insert(goPrepIngredients)
      .select();

    if (error) {
      console.error('Error inserting ingredients:', error);
      return { success: false, error: `Failed to insert ingredients: ${error.message}` };
    }

    return { success: true, imported: data?.length || 0 };
  } catch (error) {
    console.error('Ingredients import error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const importGoPrepMealIngredients = async () => {
  try {
    // Clear existing meal ingredients
    const { error: deleteError } = await supabase
      .from('meal_ingredients')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
      console.error('Error clearing existing meal ingredients:', deleteError);
      return { success: false, error: 'Failed to clear existing meal ingredients' };
    }

    // Get all meals and ingredients from database
    const { data: meals, error: mealsError } = await supabase
      .from('meals')
      .select('id, name');

    const { data: ingredients, error: ingredientsError } = await supabase
      .from('ingredients')
      .select('id, name');

    if (mealsError || ingredientsError) {
      return { success: false, error: 'Failed to fetch meals or ingredients' };
    }

    // Create mappings
    const mealMap = new Map(meals?.map(m => [m.name, m.id]) || []);
    const ingredientMap = new Map(ingredients?.map(i => [i.name, i.id]) || []);

    const mealIngredientsToInsert = [];
    let totalMappings = 0;

    // Process sample meal ingredients
    for (const [mealName, ingredientsList] of Object.entries(sampleMealIngredients)) {
      const mealId = mealMap.get(mealName);
      if (!mealId) continue;

      for (const mealIngredient of ingredientsList) {
        const ingredientId = ingredientMap.get(mealIngredient.ingredient);
        if (!ingredientId) continue;

        mealIngredientsToInsert.push({
          meal_id: mealId,
          ingredient_id: ingredientId,
          quantity: mealIngredient.quantity,
          unit: 'g'
        });
        totalMappings++;
      }
    }

    // Insert meal ingredients in batches
    if (mealIngredientsToInsert.length > 0) {
      const batchSize = 50;
      let totalInserted = 0;

      for (let i = 0; i < mealIngredientsToInsert.length; i += batchSize) {
        const batch = mealIngredientsToInsert.slice(i, i + batchSize);
        
        const { data, error } = await supabase
          .from('meal_ingredients')
          .insert(batch)
          .select();

        if (error) {
          console.error('Error inserting meal ingredients batch:', error);
          return { success: false, error: `Failed to insert meal ingredients: ${error.message}` };
        }

        totalInserted += data?.length || 0;
      }

      return { success: true, imported: totalInserted };
    }

    return { success: true, imported: 0 };
  } catch (error) {
    console.error('Meal ingredients import error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};