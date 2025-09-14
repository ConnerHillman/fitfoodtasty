import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Facebook, Instagram, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';
import kitchenTeamImage from '@/assets/about-kitchen-team.jpg';
import mealSelectionImage from '@/assets/about-meal-selection.jpg';
import deliveryServiceImage from '@/assets/about-delivery-service.jpg';
import founderImage from '@/assets/about-founder.jpg';

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className="text-display-md text-primary">ABOUT FIT FOOD TASTY</h1>
          <h3 className="text-heading-md text-muted-foreground mb-8">
            Fit Food Tasty is the home of healthy and nutritious meal prep meals.
          </h3>
        </section>

        {/* History Section */}
        <section className="mb-12">
          <h2 className="text-heading-lg mb-6">A History Of Promoting Healthy Eating</h2>
          
          <div className="grid md:grid-cols-2 gap-8 items-center mb-8">
            <div className="prose prose-lg max-w-none text-foreground">
              <p className="mb-4">
                Fit Food Tasty is a leading provider of healthy meal prep services. Based in Bridgwater, we serve quality meals to our local customers in Taunton, Weston Super Mare, Bristol, and the surrounding areas. Due to growing demand, we now also deliver our delicious food to the rest of the UK via DPD.
              </p>
              <p className="mb-6">
                Eating healthy should be easy, convenient, and most important of all, delicious. Our founder experienced the struggle of finding nutritious and healthy meals during the lockdown period of 2020. Frustrated with the lack of options available that support a healthy lifestyle, we set out to create a solution.
              </p>
            </div>
            <div className="relative">
              <img 
                src={founderImage} 
                alt="Our founder, Conner, the biggest fan of healthy eating options" 
                className="w-full h-64 object-cover rounded-lg shadow-lg"
              />
            </div>
          </div>
          
          <div className="bg-muted p-6 rounded-lg mb-6">
            <h3 className="text-heading-md mb-4">Enter Fit Food Tasty</h3>
            <p>
              We provide fresh, nutritional meals, using only high quality ingredients, without the time and effort involved in preparing your own meals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="mb-4">
                We understand that everyone has different preferences when it comes to food, which is why we offer a full menu and wide range of meal plans to choose from.
              </p>
              <p className="mb-6">
                Do you prefer to cook the same meals every day? Or like to mix it up with variety? We have a solution for you. Our in-house expert chefs cook all our healthy meals using the highest quality ingredients. It's almost like having your own personal chef.
              </p>
            </div>
            <div className="relative">
              <img 
                src={mealSelectionImage} 
                alt="Meal Selection from Fit Food Tasty" 
                className="w-full h-64 object-cover rounded-lg shadow-lg"
              />
            </div>
          </div>
        </section>

        {/* Service Features */}
        <section className="mb-12">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🚚</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Fresh Delivery</h3>
                <p className="text-sm text-muted-foreground">
                  Freshly prepared meal prep delivery service
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🥗</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Fresh Ingredients</h3>
                <p className="text-sm text-muted-foreground">
                  Only fresh ingredients are used to make our super tasty meals
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">👨‍🍳</span>
                </div>
                <h3 className="text-heading-sm mb-2">Expert Team</h3>
                <p className="text-body-md text-muted-foreground">
                  Our dedicated team based in our prep kitchen in Bridgwater
                </p>
              </CardContent>
            </Card>
          </div>

          <p className="text-center mb-6">
            All of our meals are ready to eat and super easy. Enjoy them hot, by reheating them in the microwave, or cold, as some of our dishes are even better served chilled.
          </p>
          
          <p className="mb-6">
            Our meal prep services provide the most cost-efficient and convenient way to fuel yourself with high-quality nutrition. Meals can be safely reheated and enjoyed within 4-5 days, making them perfect for those with busy lifestyles. We take pride in our passion for providing the best meal prep possible. And we're committed to delivering the tastiest and healthiest meals to our customers.
          </p>
        </section>

        {/* High Quality Section */}
        <section className="mb-12">
          <div className="bg-card p-8 rounded-lg border">
            <h3 className="text-2xl font-semibold mb-4">High Quality Meal Prep</h3>
            <p className="mb-4">
              We strive to be the go-to meal prep service in the area, offering the highest quality meals with exceptional service. Our focus on high-quality nutrition and convenience sets us apart from the rest.
            </p>
            <p className="mb-6">
              At Fit Food Tasty, we're more than just a meal prep business. We're passionate about helping our customers achieve their health, weight loss, and fitness goals with delicious and nutritious food. And we take the time to listen to your needs and preferences. Our expert chefs create meals and snacks that not only taste great but are also packed with nutrients.
            </p>
            <p className="mb-6 font-semibold">
              Try us today and experience the difference in life that high-quality meal prep can make.
            </p>
            <div className="text-center">
              <Button asChild size="lg">
                <Link to="/menu">Order Yours Now</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-center">LOCAL AND NATIONWIDE MEAL PREP SERVICES</h2>
          <p className="text-center mb-8">
            Fit Food Tasty specialises in cooking delicious, healthy prepped meals. Our meals are not only for people that go to the gym. They're for anyone looking to lose weight, gain muscle, reduce food waste, or simply improve their lifestyle & eating habits. All without sacrificing taste and time.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Local Services */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Local Delivery</h3>
                <div className="mb-4">
                  <img 
                    src={deliveryServiceImage} 
                    alt="Local delivery service in Bridgwater area" 
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                </div>
                <p className="mb-4">
                  From January 2021 when we first opened our doors, until September 2022, we focused our efforts on providing a great service to our local customers in Bridgwater and surrounding areas including Taunton, Weston Super Mare, and Bristol.
                </p>
                <div className="space-y-2 text-sm">
                  <p><strong>Delivery Days:</strong> Sunday, Monday and Wednesday</p>
                  <p><strong>Delivery Time:</strong> 6pm-8.30pm each week</p>
                  <p><strong>Collection:</strong> Available during working hours</p>
                </div>
              </CardContent>
            </Card>

            {/* Nationwide Services */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">UK Nationwide</h3>
                <div className="mb-4">
                  <img 
                    src={deliveryServiceImage} 
                    alt="Nationwide delivery across the UK" 
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                </div>
                <p className="mb-4">
                  Wherever you are in the UK, we can still get your food delivered to you safe, sound and fresh! We achieve this by using DPD courier, combined with high quality insulative packaging, complete with ice gel packs.
                </p>
                <div className="space-y-2 text-sm">
                  <p><strong>Delivery Day:</strong> Tuesday</p>
                  <p><strong>Delivery Time:</strong> Within 24 hours of collection</p>
                  <p><strong>Tracking:</strong> Text/email notifications with time slots</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Contact Section */}
        <section className="mb-12">
          <div className="bg-muted p-8 rounded-lg text-center">
            <h3 className="text-xl font-semibold mb-4">Get In Touch</h3>
            <p className="mb-6">
              For any questions, help or advice you can contact the meal prep team:
            </p>
            
            <div className="flex justify-center space-x-6 mb-6">
              <a 
                href="mailto:info@fitfoodtasty.co.uk"
                className="flex items-center space-x-2 text-primary hover:underline"
              >
                <Mail className="h-5 w-5" />
                <span>info@fitfoodtasty.co.uk</span>
              </a>
            </div>

            <div className="flex justify-center space-x-4">
              <Button variant="outline" size="sm" asChild>
                <a href="https://www.facebook.com/FitFoodTastyBridgwater" target="_blank" rel="noopener noreferrer">
                  <Facebook className="h-4 w-4 mr-2" />
                  Facebook
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="https://www.instagram.com/fitfood.tasty/" target="_blank" rel="noopener noreferrer">
                  <Instagram className="h-4 w-4 mr-2" />
                  Instagram
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="https://www.youtube.com/channel/UCBZqk7QRvDrzXsay5fdfQTw" target="_blank" rel="noopener noreferrer">
                  <Youtube className="h-4 w-4 mr-2" />
                  YouTube
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="text-center">
          <h2 className="text-2xl font-semibold mb-6">THE FIT FOOD TASTY MEAL PREP TEAM</h2>
          <div className="mb-6">
            <img 
              src={kitchenTeamImage} 
              alt="The Fit Food Tasty meal prep team" 
              className="w-full max-w-4xl h-64 object-cover rounded-lg shadow-lg mx-auto"
            />
          </div>
          <p className="text-muted-foreground">
            Our passionate team is dedicated to providing you with the highest quality meal prep experience.
          </p>
        </section>

      </div>
    </div>
  );
};

export default About;