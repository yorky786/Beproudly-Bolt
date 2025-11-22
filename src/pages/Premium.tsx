import { useState } from 'react';
import { Crown, Zap, Star, Check, Flame, Sparkles, Heart, TrendingUp } from 'lucide-react';

export default function Premium() {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');

  const plans = [
    {
      name: 'Pride Basic',
      price: selectedPlan === 'monthly' ? 9.99 : 99.99,
      period: selectedPlan === 'monthly' ? 'month' : 'year',
      savings: selectedPlan === 'annual' ? 'Save 17%' : null,
      icon: Star,
      color: 'from-blue-400 to-cyan-400',
      features: [
        'Unlimited likes',
        '5 Super Likes per day',
        'See who liked you',
        'Advanced filters',
        'No ads',
      ],
    },
    {
      name: 'Pride Premium',
      price: selectedPlan === 'monthly' ? 19.99 : 199.99,
      period: selectedPlan === 'monthly' ? 'month' : 'year',
      savings: selectedPlan === 'annual' ? 'Save 17%' : null,
      icon: Crown,
      color: 'from-purple-400 to-pink-400',
      features: [
        'Everything in Basic',
        'Profile boost (5x per month)',
        'Spotlight Blaze feature',
        '1000 Flames monthly',
        'Exclusive AR filters',
        'Priority support',
      ],
      popular: true,
    },
    {
      name: 'Pride Elite',
      price: selectedPlan === 'monthly' ? 29.99 : 299.99,
      period: selectedPlan === 'monthly' ? 'month' : 'year',
      savings: selectedPlan === 'annual' ? 'Save 17%' : null,
      icon: Sparkles,
      color: 'from-yellow-400 to-orange-400',
      features: [
        'Everything in Premium',
        'Unlimited boosts',
        'Verified badge',
        '3000 Flames monthly',
        'VIP events access',
        'Custom AR effects',
        'Analytics dashboard',
      ],
    },
  ];

  const flamePackages = [
    { amount: 500, price: 4.99, bonus: 0 },
    { amount: 1200, price: 9.99, bonus: 200 },
    { amount: 2500, price: 19.99, bonus: 500 },
    { amount: 6000, price: 49.99, bonus: 1500 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-5 h-5" />
            <span className="font-semibold">Premium Features</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Upgrade Your Pride Experience
          </h1>
          <p className="text-xl text-gray-600">
            Stand out, connect more, and unlock exclusive features
          </p>
        </div>

        <div className="flex justify-center gap-3 mb-8">
          <button
            onClick={() => setSelectedPlan('monthly')}
            className={`px-6 py-3 rounded-xl font-semibold transition ${
              selectedPlan === 'monthly'
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setSelectedPlan('annual')}
            className={`px-6 py-3 rounded-xl font-semibold transition relative ${
              selectedPlan === 'annual'
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Annual
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              Save 17%
            </span>
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-16">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.name}
                className={`bg-white rounded-3xl shadow-xl overflow-hidden relative ${
                  plan.popular ? 'ring-4 ring-purple-500' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-4 right-4 bg-purple-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                    Most Popular
                  </div>
                )}

                <div className={`h-32 bg-gradient-to-br ${plan.color} flex items-center justify-center`}>
                  <Icon className="w-16 h-16 text-white" />
                </div>

                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-600">/ {plan.period}</span>
                  </div>
                  {plan.savings && (
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold inline-block mb-4">
                      {plan.savings}
                    </div>
                  )}

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`w-full py-3 rounded-xl font-semibold transition ${
                      plan.popular
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Choose Plan
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-400 to-red-500 text-white px-4 py-2 rounded-full mb-4">
              <Flame className="w-5 h-5" fill="white" />
              <span className="font-semibold">Flames Currency</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Buy Flames</h2>
            <p className="text-gray-600">
              Use Flames to boost your profile, send gifts, and unlock premium features
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {flamePackages.map((pkg) => (
              <div
                key={pkg.amount}
                className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 text-center hover:shadow-lg transition cursor-pointer"
              >
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Flame className="w-8 h-8 text-orange-500" fill="currentColor" />
                  <span className="text-3xl font-bold text-gray-900">{pkg.amount}</span>
                </div>
                {pkg.bonus > 0 && (
                  <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full mb-2 inline-block">
                    +{pkg.bonus} Bonus
                  </div>
                )}
                <p className="text-2xl font-bold text-gray-900 mb-4">${pkg.price}</p>
                <button className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition">
                  Buy Now
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-3xl shadow-xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-6 text-center">What You Can Do With Flames</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8" />
              </div>
              <h3 className="font-bold mb-2">Boost Profile</h3>
              <p className="text-sm opacity-90">Get 10x more visibility for 30 minutes</p>
              <p className="text-lg font-bold mt-2">100 Flames</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8" fill="white" />
              </div>
              <h3 className="font-bold mb-2">Super Like</h3>
              <p className="text-sm opacity-90">Stand out with a special notification</p>
              <p className="text-lg font-bold mt-2">50 Flames</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="font-bold mb-2">Send Gift</h3>
              <p className="text-sm opacity-90">Send virtual gifts to your matches</p>
              <p className="text-lg font-bold mt-2">25-500 Flames</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
