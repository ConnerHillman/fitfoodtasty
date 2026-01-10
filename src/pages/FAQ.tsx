import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  X, 
  ShoppingCart, 
  Truck, 
  CreditCard, 
  Utensils, 
  RefreshCw, 
  HelpCircle,
  MessageCircle,
  ChevronRight
} from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  // Ordering
  {
    category: "Ordering",
    question: "How do I place an order?",
    answer: "Simply browse our menu, add meals to your cart, and proceed to checkout. You can order individual meals or choose one of our value packages. We accept all major credit/debit cards and Apple Pay."
  },
  {
    category: "Ordering",
    question: "Is there a minimum order?",
    answer: "Minimum order requirements vary by delivery zone. Most areas have a £30 minimum for delivery. There's no minimum for collection orders."
  },
  {
    category: "Ordering",
    question: "Can I customize my meals?",
    answer: "Our meals are prepared fresh with carefully balanced macros and cannot be customized. However, we offer a wide variety of options including regular, massive meals, and low-calorie options to suit different dietary needs."
  },
  {
    category: "Ordering",
    question: "How do I use a discount code?",
    answer: "Enter your discount code at checkout in the 'Coupon Code' field. The discount will be applied automatically if valid. Some codes may have minimum order requirements."
  },
  {
    category: "Ordering",
    question: "Can I order for someone else?",
    answer: "Yes! During checkout, you can specify a different delivery address. You can also purchase gift cards which make perfect presents for health-conscious friends and family."
  },

  // Delivery
  {
    category: "Delivery",
    question: "What are your delivery days?",
    answer: "We offer local delivery on Sunday, Monday, and Wednesday. Nationwide delivery is available via DPD courier. Delivery days may vary by location - check your postcode at checkout for available options."
  },
  {
    category: "Delivery",
    question: "How much does delivery cost?",
    answer: "Delivery fees vary by zone, typically ranging from £2.99 to £5.99 for local delivery. Nationwide DPD delivery has different rates. Some promotions include free delivery - check our current offers!"
  },
  {
    category: "Delivery",
    question: "Do you deliver to my area?",
    answer: "We deliver across Somerset and surrounding areas for local delivery, plus nationwide via DPD. Enter your postcode at checkout to see available delivery options for your location."
  },
  {
    category: "Delivery",
    question: "Can I collect my order instead?",
    answer: "Yes! Free collection is available from our Bridgwater location. Select 'Collection' at checkout and choose your preferred collection day and time slot."
  },
  {
    category: "Delivery",
    question: "What if I'm not home for delivery?",
    answer: "You can add delivery instructions at checkout (e.g., 'leave with neighbor' or 'safe place'). Our drivers will follow your instructions. For DPD deliveries, you'll receive tracking and can arrange redelivery."
  },

  // Meals & Nutrition
  {
    category: "Meals & Nutrition",
    question: "How long do the meals last?",
    answer: "Our meals are freshly prepared and have a shelf life of 5-7 days when refrigerated. Each meal label shows the specific use-by date. Meals can also be frozen for longer storage."
  },
  {
    category: "Meals & Nutrition",
    question: "Are nutritional values accurate?",
    answer: "Yes, all nutritional information is calculated from our recipes using verified ingredient data. Each meal displays calories, protein, carbs, fat, and other macros on the label."
  },
  {
    category: "Meals & Nutrition",
    question: "Do you cater for allergies?",
    answer: "All allergen information is clearly displayed on each meal. We handle common allergens in our kitchen, so while we take precautions, we cannot guarantee meals are allergen-free. If you have severe allergies, please contact us before ordering."
  },
  {
    category: "Meals & Nutrition",
    question: "How should I store the meals?",
    answer: "Keep meals refrigerated at 0-5°C immediately upon receipt. Meals can be frozen if you won't consume them before the use-by date. Heating instructions are on each label - most meals microwave in 3-4 minutes."
  },
  {
    category: "Meals & Nutrition",
    question: "What's the difference between Regular and Massive Meals?",
    answer: "Regular meals are portion-controlled for standard calorie goals. Massive Meals are larger portions with more protein and calories, perfect for those with higher energy needs or intense training schedules."
  },

  // Payment
  {
    category: "Payment",
    question: "What payment methods do you accept?",
    answer: "We accept all major credit and debit cards (Visa, Mastercard, American Express), Apple Pay, and Google Pay. All payments are securely processed through Stripe."
  },
  {
    category: "Payment",
    question: "Is my payment information secure?",
    answer: "Absolutely. We use Stripe for payment processing, which is PCI-DSS compliant. We never store your full card details on our servers."
  },
  {
    category: "Payment",
    question: "Can I use a gift card?",
    answer: "Yes! Gift cards can be redeemed at checkout. Enter your gift card code in the designated field, and the balance will be applied to your order. Any remaining balance stays on your card for future use."
  },
  {
    category: "Payment",
    question: "Do you offer refunds?",
    answer: "If there's an issue with your order, please contact us within 24 hours of delivery. We'll arrange a refund or replacement for any meals that don't meet our quality standards. See our Terms of Service for full details."
  },

  // Subscriptions
  {
    category: "Subscriptions",
    question: "How do subscriptions work?",
    answer: "Subscribe to receive regular meal deliveries at a discounted rate. Choose your plan, select your meals, and we'll deliver on your chosen schedule. You can pause, skip, or cancel anytime."
  },
  {
    category: "Subscriptions",
    question: "Can I change my subscription meals?",
    answer: "Yes! You can update your meal selections before the weekly cutoff time. Log in to your account and visit the Subscriptions page to make changes."
  },
  {
    category: "Subscriptions",
    question: "How do I pause or cancel my subscription?",
    answer: "You can pause or cancel your subscription anytime through your account settings or by contacting us. Changes made before the cutoff will apply to your next delivery."
  },

  // Account
  {
    category: "Account",
    question: "How do I create an account?",
    answer: "Click 'Sign In' and select 'Create Account'. You can register with your email address. An account lets you track orders, save addresses, and access order history."
  },
  {
    category: "Account",
    question: "I forgot my password - what do I do?",
    answer: "Click 'Sign In', then 'Forgot Password'. Enter your email address and we'll send you a secure link to reset your password. The link expires after 1 hour for security."
  },
  {
    category: "Account",
    question: "How do I update my delivery address?",
    answer: "Log in to your account and go to Account Settings. You can update your default delivery address there, or enter a different address during checkout."
  },
];

const categories = [
  { id: "all", label: "All Questions", icon: HelpCircle },
  { id: "Ordering", label: "Ordering", icon: ShoppingCart },
  { id: "Delivery", label: "Delivery", icon: Truck },
  { id: "Meals & Nutrition", label: "Meals & Nutrition", icon: Utensils },
  { id: "Payment", label: "Payment", icon: CreditCard },
  { id: "Subscriptions", label: "Subscriptions", icon: RefreshCw },
  { id: "Account", label: "Account", icon: HelpCircle },
];

const FAQ = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredFAQs = useMemo(() => {
    let result = faqData;

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter(faq => faq.category === selectedCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        faq =>
          faq.question.toLowerCase().includes(query) ||
          faq.answer.toLowerCase().includes(query)
      );
    }

    return result;
  }, [searchQuery, selectedCategory]);

  // Group FAQs by category for display
  const groupedFAQs = useMemo(() => {
    const groups: Record<string, FAQItem[]> = {};
    filteredFAQs.forEach(faq => {
      if (!groups[faq.category]) {
        groups[faq.category] = [];
      }
      groups[faq.category].push(faq);
    });
    return groups;
  }, [filteredFAQs]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
  };

  const hasActiveFilters = searchQuery.trim() !== "" || selectedCategory !== "all";

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16 sm:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Find answers to common questions about ordering, delivery, meals, and more.
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-12 h-12 text-base"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Category Filters */}
      <section className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant={selectedCategory === id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(id)}
                className="gap-2"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Results count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground">
              {filteredFAQs.length} question{filteredFAQs.length !== 1 ? "s" : ""} found
              {searchQuery && ` for "${searchQuery}"`}
            </p>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear filters
              </Button>
            )}
          </div>

          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="text-lg text-muted-foreground">
                No questions found matching your search.
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedFAQs).map(([category, faqs]) => (
                <div key={category}>
                  {/* Category Header (only show if viewing all) */}
                  {selectedCategory === "all" && (
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="secondary" className="text-sm font-medium">
                        {category}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        ({faqs.length} question{faqs.length !== 1 ? "s" : ""})
                      </span>
                    </div>
                  )}

                  <Accordion type="single" collapsible className="space-y-2">
                    {faqs.map((faq, index) => (
                      <AccordionItem
                        key={`${category}-${index}`}
                        value={`${category}-${index}`}
                        className="border border-border rounded-lg px-4 bg-card"
                      >
                        <AccordionTrigger className="text-left hover:no-underline py-4">
                          <span className="font-medium pr-4">{faq.question}</span>
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground pb-4">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Still Need Help CTA */}
      <section className="py-12 sm:py-16 bg-muted/50 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold mb-2">Still have questions?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Can't find what you're looking for? Our friendly team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link to="/contact">
                Contact Us
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <a href="mailto:info@fitfoodtasty.co.uk">
                Email Support
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQ;
